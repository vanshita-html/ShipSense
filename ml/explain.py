import json
from pathlib import Path
from typing import Any, Dict, List, Tuple
import joblib
import numpy as np
import pandas as pd
import shap
from sklearn.metrics.pairwise import euclidean_distances

from ml.train import ALL_FEATURES, FEATURE_NUMERIC, FEATURE_CATEGORICAL

class SHAPExplainerService:
    def __init__(self, models_dir: Path = None):
        if models_dir is None:
            models_dir = Path(__file__).resolve().parent / "models"
        
        self.models_dir = models_dir
        self.classifier = None
        self.regressor = None
        self.preprocessor = None
        self.tree_explainer = None
        self.baseline_stats = None
        self.reference_dataset = None
        self.transformed_feature_names = None
        self._load_assets()

    def _load_assets(self):
        clf_path = self.models_dir / "delay_classifier.joblib"
        reg_path = self.models_dir / "delay_regressor.joblib"
        prep_path = self.models_dir / "preprocessor.joblib"
        stats_path = self.models_dir / "baseline_stats.json"
        data_path = self.models_dir.parent / "data" / "shipments_seed.csv"

        if clf_path.exists() and prep_path.exists():
            self.classifier = joblib.load(clf_path)
            self.regressor = joblib.load(reg_path) if reg_path.exists() else None
            self.preprocessor = joblib.load(prep_path)
            
            # Initialize SHAP TreeExplainer on XGBoost
            self.tree_explainer = shap.TreeExplainer(self.classifier)

            if stats_path.exists():
                with open(stats_path, "r") as f:
                    self.baseline_stats = json.load(f)
                    self.transformed_feature_names = self.baseline_stats.get("feature_names_transformed", [])

            if data_path.exists():
                self.reference_dataset = pd.read_csv(data_path)

    @staticmethod
    def get_risk_band(probability_pct: float) -> str:
        """Categorize into risk bands: Low 0-30, Medium 31-50, High 51-70, Critical 71-100."""
        if probability_pct <= 30.0:
            return "Low"
        elif probability_pct <= 50.0:
            return "Medium"
        elif probability_pct <= 70.0:
            return "High"
        else:
            return "Critical"

    def predict_and_explain(self, shipment_dict: Dict[str, Any]) -> Dict[str, Any]:
        """
        Run inference and generate SHAP natural language explanations.
        """
        if self.classifier is None or self.preprocessor is None:
            self._load_assets()
            if self.classifier is None:
                raise RuntimeError("ML Models are not yet trained. Run ml/train.py first.")

        # Construct single-row DataFrame
        df_single = pd.DataFrame([shipment_dict])[ALL_FEATURES]
        X_trans = self.preprocessor.transform(df_single)

        # Classifier prediction
        prob_delay = float(self.classifier.predict_proba(X_trans)[0, 1]) * 100.0
        prob_delay = round(prob_delay, 1)
        risk_band = self.get_risk_band(prob_delay)

        # Regressor expected days
        if self.regressor is not None:
            raw_days = float(self.regressor.predict(X_trans)[0])
            expected_days = round(max(0.0, raw_days), 1)
        else:
            expected_days = round(prob_delay / 20.0, 1)

        # Confidence Score calculation based on probability margin from decision boundary (50%)
        confidence_score = round(min(98.0, 60.0 + abs(prob_delay - 50.0) * 0.76), 1)

        # SHAP calculation
        shap_values = self.tree_explainer.shap_values(X_trans)
        if isinstance(shap_values, list):
            # For binary classification, use positive class values
            shap_row = shap_values[1][0]
        elif len(shap_values.shape) == 2:
            shap_row = shap_values[0]
        else:
            shap_row = shap_values

        drivers = self._format_shap_drivers(shipment_dict, shap_row)

        return {
            "risk_probability": prob_delay,
            "expected_delay_days": expected_days,
            "risk_band": risk_band,
            "confidence_score": confidence_score,
            "shap_drivers": drivers,
        }

    def _format_shap_drivers(self, row: Dict[str, Any], shap_row: np.ndarray) -> List[Dict[str, Any]]:
        """
        Transform raw SHAP values into plain English positive and negative drivers.
        """
        feature_impacts = []
        
        # Numeric features mapping
        for idx, feat in enumerate(FEATURE_NUMERIC):
            val = row.get(feat, 0)
            impact = float(shap_row[idx])
            feature_impacts.append({
                "feature": feat,
                "value": val,
                "shap_impact": impact,
            })

        # Categorical features mapping (aggregated or highest dummy)
        offset = len(FEATURE_NUMERIC)
        cat_encoder = self.preprocessor.named_transformers_["cat"]
        cat_features_out = cat_encoder.get_feature_names_out(FEATURE_CATEGORICAL)
        
        for feat_name, impact in zip(cat_features_out, shap_row[offset:]):
            feature_impacts.append({
                "feature": feat_name,
                "value": "Active",
                "shap_impact": float(impact),
            })

        # Sort by magnitude
        feature_impacts.sort(key=lambda x: abs(x["shap_impact"]), reverse=True)

        formatted_drivers = []
        for item in feature_impacts[:6]:
            feat = item["feature"]
            impact = item["shap_impact"]
            direction = "INCREASES_RISK" if impact > 0 else "REDUCES_RISK"
            plain_text = self._to_plain_english(feat, row, impact)
            
            formatted_drivers.append({
                "feature": feat,
                "direction": direction,
                "impact_magnitude": round(abs(impact) * 10.0, 1),
                "shap_value": round(impact, 4),
                "explanation": plain_text,
            })

        return formatted_drivers

    def _to_plain_english(self, feat: str, row: Dict[str, Any], impact: float) -> str:
        pct = abs(impact) * 15.0
        pct_str = f"{pct:.1f}%"
        
        if "weather_severity" in feat:
            val = row.get("weather_severity", 0)
            if impact > 0:
                return f"Severe weather conditions (Severity: {val}/10) elevated route delay risk by +{pct_str}."
            else:
                return f"Favorable weather conditions (Severity: {val}/10) mitigated transit risks by -{pct_str}."
                
        elif "hub_congestion" in feat:
            val = row.get("hub_congestion", 0)
            if impact > 0:
                return f"High bottleneck / hub congestion index ({val}/100) increased lead time risk by +{pct_str}."
            else:
                return f"Low hub congestion ({val}/100) provided smooth transit clearance (-{pct_str})."

        elif "supplier_reliability" in feat:
            val = row.get("supplier_reliability", 0)
            if impact > 0:
                return f"Lower historical carrier reliability ({val}%) increased disruption probability by +{pct_str}."
            else:
                return f"High carrier reliability ({val}%) reinforced on-time confidence (-{pct_str})."

        elif "inventory_level" in feat:
            val = row.get("inventory_level", 0)
            if impact > 0:
                return f"Low inventory buffer stock ({val} days) leaves little safety margin (+{pct_str})."
            else:
                return f"Healthy inventory buffer ({val} days) effectively absorbs variance (-{pct_str})."

        elif "distance_km" in feat:
            val = row.get("distance_km", 0)
            return f"Long corridor transit distance ({val} km) increases potential transit exposure."

        elif "transport_mode" in feat:
            mode = row.get("transport_mode", "Road")
            return f"Transport mode ({mode}) affects vulnerability to corridor bottlenecks."

        elif "order_priority" in feat:
            priority = row.get("order_priority", "Standard")
            return f"Priority designation ({priority}) influences dispatch queueing."

        return f"Feature {feat} contributed {'positively' if impact > 0 else 'negatively'} to overall delay risk."

    def find_similar_shipments(self, shipment_dict: Dict[str, Any], top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Find the top K most similar historical shipments using normalized Euclidean feature distance.
        """
        if self.reference_dataset is None or self.preprocessor is None:
            self._load_assets()
            if self.reference_dataset is None:
                return []

        df_target = pd.DataFrame([shipment_dict])[ALL_FEATURES]
        target_trans = self.preprocessor.transform(df_target)

        # Sample subset of reference dataset for fast similarity search
        ref_subset = self.reference_dataset.sample(n=min(1000, len(self.reference_dataset)), random_state=42)
        ref_trans = self.preprocessor.transform(ref_subset[ALL_FEATURES])

        distances = euclidean_distances(target_trans, ref_trans)[0]
        top_indices = np.argsort(distances)[:top_k]

        similar = []
        for idx in top_indices:
            row = ref_subset.iloc[idx].to_dict()
            similarity_pct = round(max(50.0, 100.0 - (distances[idx] * 8.5)), 1)
            similar.append({
                "shipment_id": row.get("shipment_id"),
                "origin": row.get("origin"),
                "destination": row.get("destination"),
                "corridor": row.get("corridor"),
                "transport_mode": row.get("transport_mode"),
                "supplier_name": row.get("supplier_name"),
                "weather_severity": row.get("weather_severity"),
                "similarity_score": similarity_pct,
                "actual_delay_days": row.get("actual_delay_days", 0),
                "delayed": bool(row.get("delayed", 0)),
                "outcome_description": f"Delayed by {row.get('actual_delay_days', 0)} days" if row.get("delayed") else "Delivered On-Time"
            })

        return similar
