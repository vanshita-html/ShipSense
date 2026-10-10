import pytest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.prescriptive_engine import prescriptive_engine

def test_recommendation_generation():
    high_risk_shipment = {
        "shipment_id": "SHP-10025",
        "risk_probability": 82.5,
        "expected_delay_days": 3.8,
        "transport_mode": "Road",
        "corridor": "Mumbai - Bangalore",
        "shap_drivers": [
            {
                "feature": "weather_severity",
                "direction": "INCREASES_RISK",
                "impact_magnitude": 28.5,
                "shap_value": 0.35,
                "explanation": "Severe monsoon weather along Western corridor increased risk."
            }
        ]
    }

    recs = prescriptive_engine.generate_recommendations(high_risk_shipment)
    assert len(recs) >= 3
    
    # Top recommendation should match weather risk (e.g. Expedite Air)
    top_rec = recs[0]
    assert "action_id" in top_rec
    assert "relevance_score" in top_rec
    assert top_rec["relevance_score"] > 80.0
    assert "trade_offs" in top_rec
    assert "cost_impact" in top_rec["trade_offs"]
    assert "time_gain" in top_rec["trade_offs"]
    assert top_rec["status"] == "MANAGER_REVIEW_REQUIRED"
    assert "Decision Support Mode" in top_rec["guardrail_notice"]
