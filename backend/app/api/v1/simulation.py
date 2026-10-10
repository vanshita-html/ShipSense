from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Body
from app.services.simulator_service import simulator_service, SCENARIOS
from app.services.ml_service import ml_service
from app.schemas.shipment import WhatIfRequest, WhatIfResponse, SHAPDriver
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/simulation", tags=["Simulation & What-If Sandbox"])

@router.get("/status")
def get_simulation_status(current_user: User = Depends(get_current_user)):
    """Get active telemetry simulation state and scenario metadata."""
    return {
        "is_running": simulator_service.is_running,
        "current_scenario": simulator_service.current_scenario,
        "interval_sec": simulator_service.interval_sec,
        "available_scenarios": [
            {"key": k, "name": v["name"], "description": v["description"]}
            for k, v in SCENARIOS.items()
        ]
    }

@router.post("/set-scenario")
def set_scenario(
    scenario: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user)
):
    """Switch active simulation scenario (Normal, Monsoon disruption, Port strike, Fuel spike)."""
    try:
        updated = simulator_service.set_scenario(scenario)
        return {"status": "success", "active_scenario": updated}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/set-interval")
def set_interval(
    interval_sec: int = Body(..., embed=True),
    current_user: User = Depends(get_current_user)
):
    """Adjust live telemetry stream frequency (2s - 60s)."""
    return simulator_service.set_interval(interval_sec)

@router.post("/start")
def start_simulation(current_user: User = Depends(get_current_user)):
    """Start background telemetry ingestion stream."""
    simulator_service.start()
    return {"status": "started", "is_running": True}

@router.post("/stop")
def stop_simulation(current_user: User = Depends(get_current_user)):
    """Pause background telemetry stream."""
    simulator_service.stop()
    return {"status": "stopped", "is_running": False}

@router.post("/whatif", response_model=WhatIfResponse)
def run_whatif_simulation(
    payload: WhatIfRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Run interactive what-if scenario prediction and SHAP calculation with hypothetical parameters.
    """
    data_dict = {
        "shipment_id": "SHP-WHATIF",
        "supplier_id": payload.supplier_id,
        "origin": payload.origin,
        "destination": payload.destination,
        "corridor": payload.corridor,
        "transport_mode": payload.transport_mode,
        "distance_km": payload.distance_km,
        "lead_time_days": payload.lead_time_days,
        "weather_severity": payload.weather_severity,
        "supplier_reliability": payload.supplier_reliability,
        "hub_congestion": payload.hub_congestion,
        "inventory_level": payload.inventory_level,
        "order_priority": payload.order_priority,
    }

    prediction = ml_service.predict_and_explain(data_dict)
    
    # Calculate baseline comparison (normal conditions: weather=2, congestion=30, rel=85)
    baseline_dict = dict(data_dict)
    baseline_dict.update({"weather_severity": 2.0, "hub_congestion": 30.0, "supplier_reliability": 85.0})
    baseline_pred = ml_service.predict_and_explain(baseline_dict)
    
    delta = round(prediction["risk_probability"] - baseline_pred["risk_probability"], 1)

    return WhatIfResponse(
        original_risk_probability=baseline_pred["risk_probability"],
        simulated_risk_probability=prediction["risk_probability"],
        simulated_expected_delay_days=prediction["expected_delay_days"],
        simulated_risk_band=prediction["risk_band"],
        confidence_score=prediction["confidence_score"],
        shap_drivers=[SHAPDriver(**d) for d in prediction["shap_drivers"]],
        delta_risk_pct=delta
    )
