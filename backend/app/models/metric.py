from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from app.core.database import Base

class PipelineRun(Base):
    __tablename__ = "pipeline_runs"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    stage = Column(String(80), nullable=False) # Ingestion, Validation, Feature Engineering, Prediction, Explain, Prescribe, Ledger, Feedback
    status = Column(String(30), nullable=False, default="SUCCESS") # SUCCESS, RUNNING, WARNING, FAILED
    message = Column(String(255), nullable=True)
    duration_ms = Column(Float, default=0.0)
    records_processed = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

class DriftLog(Base):
    __tablename__ = "drift_logs"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    feature_name = Column(String(80), nullable=False)
    drift_score_psi = Column(Float, nullable=False)
    ks_p_value = Column(Float, nullable=True)
    drift_status = Column(String(30), nullable=False) # None, Moderate, Critical
    sample_size = Column(Integer, default=0)
    details_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
