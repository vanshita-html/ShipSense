import math
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from app.core.database import get_db
from app.models.shipment import Shipment
from app.schemas.shipment import (
    ShipmentResponse,
    ShipmentListResponse,
    SimilarShipment,
    SHAPDriver
)
from app.services.ml_service import ml_service
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/shipments", tags=["Shipments Telemetry"])

@router.get("", response_model=ShipmentListResponse)
def get_shipments(
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    risk_band: Optional[str] = Query(None, description="Low, Medium, High, Critical"),
    transport_mode: Optional[str] = Query(None, description="Road, Rail, Air, Sea"),
    corridor: Optional[str] = Query(None),
    supplier_id: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None, description="Search by ID, supplier, city"),
    sort_by: str = Query("created_at", description="created_at, risk_probability, expected_delay_days"),
    sort_order: str = Query("desc", description="asc, desc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve paginated shipment telemetry with multi-dimensional filtering."""
    query = db.query(Shipment)

    if risk_band:
        query = query.filter(Shipment.risk_band == risk_band)
    if transport_mode:
        query = query.filter(Shipment.transport_mode == transport_mode)
    if corridor:
        query = query.filter(Shipment.corridor == corridor)
    if supplier_id:
        query = query.filter(Shipment.supplier_id == supplier_id)
    if status_filter:
        query = query.filter(Shipment.status == status_filter)
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Shipment.shipment_id.ilike(search_pattern),
                Shipment.supplier_name.ilike(search_pattern),
                Shipment.origin.ilike(search_pattern),
                Shipment.destination.ilike(search_pattern),
                Shipment.corridor.ilike(search_pattern)
            )
        )

    # Sorting
    sort_column = getattr(Shipment, sort_by, Shipment.created_at)
    if sort_order.lower() == "asc":
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))

    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    # Format response items
    formatted_items = []
    for s in items:
        resp = ShipmentResponse.model_validate(s)
        resp.shap_drivers = [SHAPDriver(**d) for d in s.shap_drivers] if s.shap_drivers else []
        formatted_items.append(resp)

    return ShipmentListResponse(
        items=formatted_items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/{shipment_id}", response_model=ShipmentResponse)
def get_shipment_detail(
    shipment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve detailed telemetry and prediction for a single shipment."""
    shipment = db.query(Shipment).filter(Shipment.shipment_id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Shipment {shipment_id} not found.")

    resp = ShipmentResponse.model_validate(shipment)
    resp.shap_drivers = [SHAPDriver(**d) for d in shipment.shap_drivers] if shipment.shap_drivers else []
    return resp

@router.get("/{shipment_id}/explain")
def explain_shipment(
    shipment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve deep SHAP explanations and plain English drivers."""
    shipment = db.query(Shipment).filter(Shipment.shipment_id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Shipment {shipment_id} not found.")

    # Re-run or return saved explanation
    data_dict = {
        "shipment_id": shipment.shipment_id,
        "supplier_id": shipment.supplier_id,
        "supplier_name": shipment.supplier_name,
        "origin": shipment.origin,
        "destination": shipment.destination,
        "corridor": shipment.corridor,
        "transport_mode": shipment.transport_mode,
        "distance_km": shipment.distance_km,
        "lead_time_days": shipment.lead_time_days,
        "weather_severity": shipment.weather_severity,
        "supplier_reliability": shipment.supplier_reliability,
        "hub_congestion": shipment.hub_congestion,
        "inventory_level": shipment.inventory_level,
        "order_priority": shipment.order_priority,
    }
    
    explanation = ml_service.predict_and_explain(data_dict)
    return {
        "shipment_id": shipment.shipment_id,
        "risk_probability": explanation["risk_probability"],
        "expected_delay_days": explanation["expected_delay_days"],
        "risk_band": explanation["risk_band"],
        "confidence_score": explanation["confidence_score"],
        "shap_drivers": explanation["shap_drivers"]
    }

@router.get("/{shipment_id}/similar", response_model=List[SimilarShipment])
def get_similar_shipments(
    shipment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Find 5 most similar historical shipments with verified outcomes."""
    shipment = db.query(Shipment).filter(Shipment.shipment_id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Shipment {shipment_id} not found.")

    data_dict = {
        "shipment_id": shipment.shipment_id,
        "supplier_id": shipment.supplier_id,
        "origin": shipment.origin,
        "destination": shipment.destination,
        "corridor": shipment.corridor,
        "transport_mode": shipment.transport_mode,
        "distance_km": shipment.distance_km,
        "lead_time_days": shipment.lead_time_days,
        "weather_severity": shipment.weather_severity,
        "supplier_reliability": shipment.supplier_reliability,
        "hub_congestion": shipment.hub_congestion,
        "inventory_level": shipment.inventory_level,
        "order_priority": shipment.order_priority,
    }

    similar = ml_service.find_similar(data_dict, top_k=5)
    return [SimilarShipment(**item) for item in similar]
