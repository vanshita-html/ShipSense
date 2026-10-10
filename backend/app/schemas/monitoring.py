from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class FeatureDriftItem(BaseModel):
    feature: str
    psi_score: float
    ks_statistic: Optional[float] = None
    ks_p_value: Optional[float] = None
    status: str
    baseline_mean: float
    current_mean: float
    baseline_std: float
    current_std: float

class DriftMonitoringResponse(BaseModel):
    overall_status: str
    drift_alert_count: int
    features_monitored: int
    sample_size_current: int
    sample_size_baseline: int
    feature_metrics: List[FeatureDriftItem]
    notice: str

class ModelHealthResponse(BaseModel):
    status: str
    model_version: str
    classifier_roc_auc: float
    classifier_accuracy: float
    classifier_precision: float
    classifier_recall: float
    classifier_f1: float
    regressor_mae_days: float
    regressor_rmse_days: float
    last_trained: str
    sample_size_test: int
    data_source_notice: str

class PipelineStageInfo(BaseModel):
    stage: str
    status: str
    last_run_time: datetime
    duration_ms: float
    records_processed: int
    message: Optional[str] = None

class PipelineStatusResponse(BaseModel):
    overall_health: str
    total_stages: int
    stages: List[PipelineStageInfo]
