import json
from fastapi import APIRouter, Depends
from app.core.config import settings
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/model", tags=["Model Metadata"])

@router.get("/info")
def get_model_info(current_user: User = Depends(get_current_user)):
    """Return model architecture, training configuration, and feature dictionary."""
    stats_file = settings.BASELINE_STATS_PATH
    info = {
        "framework": "XGBoost 2.1.3 + SHAP 0.46.0",
        "models": {
            "delay_classifier": "XGBClassifier(n_estimators=160, max_depth=5, lr=0.06)",
            "delay_regressor": "XGBRegressor(n_estimators=150, max_depth=5, lr=0.05)",
            "explainability": "SHAP TreeExplainer",
            "similarity_engine": "Normalized Euclidean KNN (k=5)"
        },
        "target_variables": {
            "delayed": "Binary classification (delayed >= 1.0 days)",
            "actual_delay_days": "Continuous delay duration in days"
        },
        "feature_count": 6,
        "features": [
            {"name": "weather_severity", "type": "numeric (0.0 - 10.0)", "description": "Meteorological hazard / rainfall index"},
            {"name": "hub_congestion", "type": "numeric (0 - 100)", "description": "Port / logistics terminal throughput bottleneck"},
            {"name": "supplier_reliability", "type": "numeric (0 - 100%)", "description": "Carrier historical SLA adherence"},
            {"name": "inventory_level", "type": "numeric (days)", "description": "Buffer safety stock at destination hub"},
            {"name": "distance_km", "type": "numeric (km)", "description": "Total corridor route distance"},
            {"name": "lead_time_days", "type": "numeric (days)", "description": "Scheduled operational transit time"},
            {"name": "transport_mode", "type": "categorical", "description": "Road, Rail, Air, Sea"},
            {"name": "order_priority", "type": "categorical", "description": "Standard, High, Critical"}
        ]
    }
    
    if stats_file.exists():
        with open(stats_file, "r") as f:
            stats = json.load(f)
            info["metrics_test_set"] = stats.get("metrics")

    return info
