from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.shipment import Shipment
from app.schemas.recommendation import (
    RecommendationResponse,
    ShipmentRecommendationsResponse
)
from app.services.prescriptive_engine import prescriptive_engine
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/recommendations", tags=["Prescriptive Analytics"])

@router.get("", response_model=ShipmentRecommendationsResponse)
def get_recommendations_for_shipment(
    shipment_id: Optional[str] = Query(None, description="Target shipment ID. If omitted, picks highest risk shipment."),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate prescriptive mitigation recommendations for high-risk consignments."""
    if shipment_id:
        shipment = db.query(Shipment).filter(Shipment.shipment_id == shipment_id).first()
        if not shipment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Shipment {shipment_id} not found.")
    else:
        # Pick highest risk active shipment
        shipment = db.query(Shipment).filter(Shipment.status == "In Transit").order_by(Shipment.risk_probability.desc()).first()
        if not shipment:
            shipment = db.query(Shipment).order_by(Shipment.risk_probability.desc()).first()
            
    if not shipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No shipments available to generate recommendations.")

    shipment_dict = {
        "shipment_id": shipment.shipment_id,
        "risk_probability": shipment.risk_probability,
        "expected_delay_days": shipment.expected_delay_days,
        "shap_drivers": shipment.shap_drivers,
        "transport_mode": shipment.transport_mode,
        "corridor": shipment.corridor,
    }

    recs = prescriptive_engine.generate_recommendations(shipment_dict)

    return ShipmentRecommendationsResponse(
        shipment_id=shipment.shipment_id,
        risk_probability=shipment.risk_probability,
        risk_band=shipment.risk_band,
        recommendations=[RecommendationResponse(**r) for r in recs]
    )

@router.get("/all-active", response_model=List[Dict[str, Any]])
def get_all_active_action_cards(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve action cards for all High and Critical risk shipments for Kanban boards."""
    high_risk_shipments = db.query(Shipment).filter(
        Shipment.status == "In Transit",
        Shipment.risk_band.in_(["High", "Critical"])
    ).order_by(Shipment.risk_probability.desc()).limit(20).all()

    action_cards = []
    for s in high_risk_shipments:
        shipment_dict = {
            "shipment_id": s.shipment_id,
            "risk_probability": s.risk_probability,
            "expected_delay_days": s.expected_delay_days,
            "shap_drivers": s.shap_drivers,
            "transport_mode": s.transport_mode,
            "corridor": s.corridor,
        }
        recs = prescriptive_engine.generate_recommendations(shipment_dict)
        if recs:
            top_rec = recs[0] # top recommendation
            action_cards.append({
                "id": f"CARD-{s.shipment_id}",
                "shipment_id": s.shipment_id,
                "corridor": s.corridor,
                "transport_mode": s.transport_mode,
                "risk_probability": s.risk_probability,
                "risk_band": s.risk_band,
                "order_priority": s.order_priority,
                "action": top_rec,
                "board_column": "RECOMMENDED" # RECOMMENDED, UNDER_REVIEW, COMMITTED, DONE
            })

    return action_cards
