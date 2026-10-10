import json
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text
from app.core.database import Base

class Shipment(Base):
    __tablename__ = "shipments"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(String(50), unique=True, index=True, nullable=False)
    supplier_id = Column(String(50), index=True, nullable=False)
    supplier_name = Column(String(120), nullable=True)
    origin = Column(String(80), index=True, nullable=False)
    destination = Column(String(80), index=True, nullable=False)
    corridor = Column(String(160), index=True, nullable=False)
    transport_mode = Column(String(30), index=True, nullable=False) # Road, Rail, Air, Sea
    distance_km = Column(Float, nullable=False)
    lead_time_days = Column(Float, nullable=False)
    weather_severity = Column(Float, nullable=False, default=2.0) # 0 to 10
    supplier_reliability = Column(Float, nullable=False, default=85.0) # 0 to 100
    hub_congestion = Column(Float, nullable=False, default=30.0) # 0 to 100
    inventory_level = Column(Float, nullable=False, default=15.0) # buffer in days or stock units
    order_priority = Column(String(30), nullable=False, default="Standard") # Standard, High, Critical
    
    # Live / Lifecycle Status
    status = Column(String(40), default="In Transit", index=True) # In Transit, At Hub, Out for Delivery, Delivered, Delayed
    
    # ML Prediction Outputs
    risk_probability = Column(Float, default=0.0) # 0 to 100%
    expected_delay_days = Column(Float, default=0.0)
    risk_band = Column(String(20), default="Low", index=True) # Low, Medium, High, Critical
    shap_drivers_json = Column(Text, nullable=True) # JSON of positive & negative drivers
    
    # Closed-Loop Actuals
    actual_delay_days = Column(Float, nullable=True)
    delayed = Column(Boolean, nullable=True)
    outcome_status = Column(String(40), nullable=True) # Correct Prediction, Underpredicted, Overpredicted, Pending
    
    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    delivered_at = Column(DateTime, nullable=True)

    @property
    def shap_drivers(self):
        if self.shap_drivers_json:
            try:
                return json.loads(self.shap_drivers_json)
            except Exception:
                return []
        return []

    @shap_drivers.setter
    def shap_drivers(self, value):
        self.shap_drivers_json = json.dumps(value)
