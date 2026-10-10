from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from app.core.database import Base

class Decision(Base):
    __tablename__ = "decisions"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(String(60), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_name = Column(String(120), nullable=False)
    user_email = Column(String(255), nullable=False)
    
    scope = Column(String(50), nullable=False, default="Single Shipment") # Single Shipment, Corridor Batch
    shipment_id = Column(String(50), nullable=True, index=True)
    target_entities = Column(Text, nullable=True) # comma separated or JSON IDs
    
    action_code = Column(String(60), nullable=False)
    action_title = Column(String(160), nullable=False)
    rationale = Column(Text, nullable=False)
    ai_recommendation_rank = Column(Integer, nullable=True)
    
    expected_effect = Column(Text, nullable=True)
    trade_offs = Column(Text, nullable=True)
    status = Column(String(40), default="Committed") # Committed, Executed, Verified
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
