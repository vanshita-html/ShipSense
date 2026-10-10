from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class TradeOffs(BaseModel):
    cost_impact: str
    time_gain: str
    feasibility: str

class RecommendationResponse(BaseModel):
    action_id: str
    action_code: str
    title: str
    urgency: str
    rationale: str
    expected_effect: str
    trade_offs: TradeOffs
    relevance_score: float
    status: str = "MANAGER_REVIEW_REQUIRED"
    guardrail_notice: str

class ShipmentRecommendationsResponse(BaseModel):
    shipment_id: str
    risk_probability: float
    risk_band: str
    recommendations: List[RecommendationResponse]
