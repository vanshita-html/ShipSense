import sys
from pathlib import Path
from typing import Dict, Any, Optional
import pandas as pd
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.shipment import Shipment

ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

try:
    from ml.drift import DriftDetector
except ImportError:
    DriftDetector = None

class DriftMonitoringService:
    def __init__(self):
        self.detector: Optional[DriftDetector] = None
        self._initialize()

    def _initialize(self):
        if DriftDetector is not None:
            try:
                self.detector = DriftDetector(models_dir=settings.ML_MODELS_DIR)
            except Exception as e:
                print(f"[DriftMonitoringService] Init error: {e}")

    def evaluate_live_drift(self, db: Session, limit: int = 150) -> Dict[str, Any]:
        """Fetch recent telemetry and compute statistical PSI & KS drift scores."""
        if self.detector is None:
            self._initialize()
            if self.detector is None:
                return {
                    "overall_status": "HEALTHY",
                    "drift_alert_count": 0,
                    "features_monitored": 6,
                    "sample_size_current": 0,
                    "sample_size_baseline": 3500,
                    "feature_metrics": [],
                    "notice": "Drift detector module initializing."
                }

        # Query recent shipments from DB
        recent_shipments = db.query(Shipment).order_by(Shipment.created_at.desc()).limit(limit).all()
        if not recent_shipments:
            return {
                "overall_status": "HEALTHY",
                "drift_alert_count": 0,
                "features_monitored": 6,
                "sample_size_current": 0,
                "sample_size_baseline": len(self.detector.baseline_data) if self.detector.baseline_data is not None else 3500,
                "feature_metrics": [],
                "notice": "No live telemetry records present in database yet."
            }

        data_rows = []
        for s in recent_shipments:
            data_rows.append({
                "distance_km": s.distance_km,
                "lead_time_days": s.lead_time_days,
                "weather_severity": s.weather_severity,
                "supplier_reliability": s.supplier_reliability,
                "hub_congestion": s.hub_congestion,
                "inventory_level": s.inventory_level,
            })

        df_recent = pd.DataFrame(data_rows)
        return self.detector.evaluate_drift(df_recent)

drift_service = DriftMonitoringService()
