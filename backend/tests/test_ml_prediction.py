import pytest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from ml.explain import SHAPExplainerService
from ml.drift import DriftDetector, calculate_psi
import pandas as pd
import numpy as np

@pytest.fixture(scope="module")
def explainer():
    models_dir = Path(__file__).resolve().parent.parent.parent / "ml" / "models"
    return SHAPExplainerService(models_dir=models_dir)

def test_ml_prediction_and_shap(explainer):
    sample_shipment = {
        "shipment_id": "SHP-TEST-001",
        "supplier_id": "SUP-101",
        "supplier_name": "Tata Logistics Hub",
        "origin": "Mumbai",
        "destination": "Bangalore",
        "corridor": "Mumbai - Bangalore",
        "transport_mode": "Road",
        "distance_km": 980.0,
        "lead_time_days": 4.0,
        "weather_severity": 8.5, # Severe weather
        "supplier_reliability": 85.0,
        "hub_congestion": 75.0, # High congestion
        "inventory_level": 4.0, # Low buffer
        "order_priority": "High"
    }

    res = explainer.predict_and_explain(sample_shipment)
    
    assert "risk_probability" in res
    assert "expected_delay_days" in res
    assert "risk_band" in res
    assert "confidence_score" in res
    assert "shap_drivers" in res

    # Under high weather and congestion, risk should be High or Critical
    assert res["risk_probability"] > 40.0
    assert res["risk_band"] in ["High", "Critical"]
    assert len(res["shap_drivers"]) > 0

    # Ensure plain English explanations exist
    top_driver = res["shap_drivers"][0]
    assert "explanation" in top_driver
    assert len(top_driver["explanation"]) > 10

def test_similarity_search(explainer):
    sample_shipment = {
        "shipment_id": "SHP-TEST-002",
        "supplier_id": "SUP-104",
        "origin": "Delhi NCR",
        "destination": "Mumbai",
        "corridor": "Delhi NCR - Mumbai",
        "transport_mode": "Air",
        "distance_km": 1420.0,
        "lead_time_days": 2.0,
        "weather_severity": 2.0,
        "supplier_reliability": 95.0,
        "hub_congestion": 25.0,
        "inventory_level": 20.0,
        "order_priority": "Critical"
    }

    similar = explainer.find_similar_shipments(sample_shipment, top_k=5)
    assert len(similar) == 5
    for item in similar:
        assert "similarity_score" in item
        assert "outcome_description" in item
        assert "actual_delay_days" in item

def test_drift_calculation():
    base = np.random.normal(50, 10, 500)
    # Similar distribution -> low PSI
    same = np.random.normal(50, 10, 500)
    psi_low = calculate_psi(base, same)
    assert psi_low < 0.15

    # Shifted distribution -> high PSI
    shifted = np.random.normal(85, 10, 500)
    psi_high = calculate_psi(base, shifted)
    assert psi_high > 0.25
