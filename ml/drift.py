import json
from pathlib import Path
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd
from scipy.stats import ks_2samp

def calculate_psi(expected: np.ndarray, actual: np.ndarray, num_buckets: int = 10) -> float:
    """
    Calculate Population Stability Index (PSI) between baseline (expected) and telemetry (actual).
    PSI < 0.1: No shift
    0.1 <= PSI < 0.25: Moderate shift
    PSI >= 0.25: Significant shift / Drift alert
    """
    if len(expected) == 0 or len(actual) == 0:
        return 0.0

    # Determine quantile bins based on expected baseline
    quantiles = np.linspace(0, 100, num_buckets + 1)
    bins = np.percentile(expected, quantiles)
    bins = np.unique(bins) # remove duplicate edges
    if len(bins) < 2:
        return 0.0

    # Ensure min/max infinity to cover edge cases
    bins[0] = -np.inf
    bins[-1] = np.inf

    expected_counts, _ = np.histogram(expected, bins=bins)
    actual_counts, _ = np.histogram(actual, bins=bins)

    # Calculate proportions with epsilon to prevent division by zero
    eps = 1e-4
    expected_pct = (expected_counts / len(expected)) + eps
    actual_pct = (actual_counts / len(actual)) + eps

    # Normalize
    expected_pct /= np.sum(expected_pct)
    actual_pct /= np.sum(actual_pct)

    psi_val = np.sum((actual_pct - expected_pct) * np.log(actual_pct / expected_pct))
    return float(max(0.0, psi_val))

class DriftDetector:
    def __init__(self, models_dir: Optional[Path] = None):
        if models_dir is None:
            models_dir = Path(__file__).resolve().parent / "models"
        self.models_dir = models_dir
        self.baseline_stats = None
        self.baseline_data = None
        self._load_baseline()

    def _load_baseline(self):
        stats_path = self.models_dir / "baseline_stats.json"
        data_path = self.models_dir.parent / "data" / "shipments_seed.csv"

        if stats_path.exists():
            with open(stats_path, "r") as f:
                self.baseline_stats = json.load(f)
        if data_path.exists():
            self.baseline_data = pd.read_csv(data_path)

    def evaluate_drift(self, recent_telemetry_df: pd.DataFrame) -> Dict[str, Any]:
        """
        Compare recent incoming telemetry against the baseline training distribution.
        """
        if self.baseline_data is None or len(recent_telemetry_df) < 5:
            # Not enough recent data or baseline missing
            return {
                "overall_status": "HEALTHY",
                "drift_alert_count": 0,
                "features_monitored": 0,
                "sample_size_current": len(recent_telemetry_df),
                "sample_size_baseline": len(self.baseline_data) if self.baseline_data is not None else 0,
                "feature_metrics": [],
                "notice": "Insufficient recent telemetry samples (<5) to establish high-confidence statistical significance."
            }

        num_features = [
            "weather_severity",
            "hub_congestion",
            "supplier_reliability",
            "inventory_level",
            "distance_km",
            "lead_time_days"
        ]

        feature_metrics = []
        critical_count = 0
        moderate_count = 0

        for col in num_features:
            if col in recent_telemetry_df.columns and col in self.baseline_data.columns:
                base_vals = self.baseline_data[col].dropna().values
                curr_vals = recent_telemetry_df[col].dropna().values

                psi_score = calculate_psi(base_vals, curr_vals, num_buckets=10)
                
                # KS test for distribution divergence
                ks_stat, p_val = ks_2samp(base_vals, curr_vals)

                if psi_score >= 0.25:
                    status = "CRITICAL_DRIFT"
                    critical_count += 1
                elif psi_score >= 0.10:
                    status = "MODERATE_DRIFT"
                    moderate_count += 1
                else:
                    status = "STABLE"

                feature_metrics.append({
                    "feature": col,
                    "psi_score": round(psi_score, 4),
                    "ks_statistic": round(float(ks_stat), 4),
                    "ks_p_value": round(float(p_val), 4),
                    "status": status,
                    "baseline_mean": round(float(np.mean(base_vals)), 2),
                    "current_mean": round(float(np.mean(curr_vals)), 2),
                    "baseline_std": round(float(np.std(base_vals)), 2),
                    "current_std": round(float(np.std(curr_vals)), 2),
                })

        overall_status = "CRITICAL" if critical_count > 0 else ("WARNING" if moderate_count > 0 else "HEALTHY")

        return {
            "overall_status": overall_status,
            "drift_alert_count": critical_count + moderate_count,
            "features_monitored": len(feature_metrics),
            "sample_size_current": len(recent_telemetry_df),
            "sample_size_baseline": len(self.baseline_data),
            "feature_metrics": feature_metrics,
            "notice": f"Calculated using PSI & 2-Sample KS test against N={len(self.baseline_data)} baseline training distribution."
        }
