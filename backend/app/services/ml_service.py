import sys
from pathlib import Path
from typing import Any, Dict, List, Optional
from app.core.config import settings

# Add root directory to path to enable importing ml package
ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

try:
    from ml.explain import SHAPExplainerService
except ImportError:
    SHAPExplainerService = None

class MLInferenceService:
    _instance: Optional["MLInferenceService"] = None

    def __init__(self):
        self.explainer: Optional[SHAPExplainerService] = None
        self._initialize()

    def _initialize(self):
        try:
            if SHAPExplainerService is not None:
                self.explainer = SHAPExplainerService(models_dir=settings.ML_MODELS_DIR)
        except Exception as e:
            print(f"[MLInferenceService] Models not loaded yet: {e}")

    @classmethod
    def get_instance(cls) -> "MLInferenceService":
        if cls._instance is None:
            cls._instance = MLInferenceService()
        return cls._instance

    def predict_and_explain(self, shipment_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Predict delay probability, expected delay days, and SHAP feature drivers."""
        if self.explainer is None or self.explainer.classifier is None:
            self._initialize()
            if self.explainer is None or self.explainer.classifier is None:
                # Fallback rule-based estimation if model is not yet compiled
                weather = shipment_dict.get("weather_severity", 2.0)
                congestion = shipment_dict.get("hub_congestion", 30.0)
                rel = shipment_dict.get("supplier_reliability", 85.0)
                prob = min(99.0, max(5.0, weather * 6.0 + congestion * 0.4 + (100 - rel) * 0.5))
                days = round(prob / 18.0, 1) if prob > 35 else 0.0
                band = "Critical" if prob > 70 else ("High" if prob > 50 else ("Medium" if prob > 30 else "Low"))
                return {
                    "risk_probability": round(prob, 1),
                    "expected_delay_days": days,
                    "risk_band": band,
                    "confidence_score": 85.0,
                    "shap_drivers": [
                        {
                            "feature": "weather_severity",
                            "direction": "INCREASES_RISK" if weather > 4 else "REDUCES_RISK",
                            "impact_magnitude": round(weather * 1.2, 1),
                            "shap_value": weather * 0.1,
                            "explanation": f"Weather severity rating is {weather}/10"
                        }
                    ]
                }

        return self.explainer.predict_and_explain(shipment_dict)

    def find_similar(self, shipment_dict: Dict[str, Any], top_k: int = 5) -> List[Dict[str, Any]]:
        """Retrieve top K similar historical shipments."""
        if self.explainer is not None:
            try:
                return self.explainer.find_similar_shipments(shipment_dict, top_k=top_k)
            except Exception:
                pass
        return []

ml_service = MLInferenceService.get_instance()
