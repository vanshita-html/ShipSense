from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class DecisionCreate(BaseModel):
    scope: str = Field(default="Single Shipment", description="Single Shipment or Corridor Batch")
    shipment_id: Optional[str] = Field(None, description="Target shipment identifier")
    target_entities: Optional[str] = Field(None, description="Comma-separated IDs or batch selector")
    action_code: str = Field(..., description="Action identifier code, e.g. EXPEDITE_AIR")
    action_title: str = Field(..., description="Action title")
    rationale: str = Field(..., min_length=10, description="Mandatory manager decision rationale")
    ai_recommendation_rank: Optional[int] = Field(None, description="AI recommendation rank (1, 2, 3)")
    expected_effect: Optional[str] = None
    trade_offs: Optional[str] = None

class DecisionResponse(BaseModel):
    id: int
    decision_id: str
    user_id: Optional[int] = None
    user_name: str
    user_email: str
    scope: str
    shipment_id: Optional[str] = None
    target_entities: Optional[str] = None
    action_code: str
    action_title: str
    rationale: str
    ai_recommendation_rank: Optional[int] = None
    expected_effect: Optional[str] = None
    trade_offs: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class OutcomeUpdateRequest(BaseModel):
    actual_delay_days: float = Field(..., ge=0.0)
    delivered_status: str = Field(default="Delivered")
