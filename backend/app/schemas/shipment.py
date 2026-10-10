from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class SHAPDriver(BaseModel):
    feature: str
    direction: str # INCREASES_RISK or REDUCES_RISK
    impact_magnitude: float
    shap_value: float
    explanation: str

class SimilarShipment(BaseModel):
    shipment_id: str
    origin: str
    destination: str
    corridor: str
    transport_mode: str
    supplier_name: Optional[str] = None
    weather_severity: float
    similarity_score: float
    actual_delay_days: float
    delayed: bool
    outcome_description: str

class ShipmentResponse(BaseModel):
    id: int
    shipment_id: str
    supplier_id: str
    supplier_name: Optional[str] = None
    origin: str
    destination: str
    corridor: str
    transport_mode: str
    distance_km: float
    lead_time_days: float
    weather_severity: float
    supplier_reliability: float
    hub_congestion: float
    inventory_level: float
    order_priority: str
    status: str
    risk_probability: float
    expected_delay_days: float
    risk_band: str
    shap_drivers: List[SHAPDriver] = []
    actual_delay_days: Optional[float] = None
    delayed: Optional[bool] = None
    outcome_status: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ShipmentListResponse(BaseModel):
    items: List[ShipmentResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

class WhatIfRequest(BaseModel):
    origin: str = "Mumbai"
    destination: str = "Bangalore"
    corridor: str = "Mumbai - Bangalore"
    transport_mode: str = "Road"
    distance_km: float = 980.0
    lead_time_days: float = 4.0
    weather_severity: float = Field(..., ge=0.0, le=10.0, description="0 to 10 scale")
    supplier_reliability: float = Field(..., ge=40.0, le=100.0, description="Carrier reliability %")
    hub_congestion: float = Field(..., ge=0.0, le=100.0, description="Hub bottleneck index")
    inventory_level: float = Field(..., ge=0.0, le=100.0, description="Buffer inventory in days")
    order_priority: str = Field(default="Standard")
    supplier_id: str = "SUP-101"

class WhatIfResponse(BaseModel):
    original_risk_probability: Optional[float] = None
    simulated_risk_probability: float
    simulated_expected_delay_days: float
    simulated_risk_band: str
    confidence_score: float
    shap_drivers: List[SHAPDriver]
    delta_risk_pct: Optional[float] = None
