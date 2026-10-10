import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import app
from app.core.database import Base, get_db
from app.models.user import User
from app.models.shipment import Shipment
from app.core.security import create_access_token

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
Base.metadata.create_all(bind=engine)
client = TestClient(app)

@pytest.fixture
def auth_context():
    db = TestingSessionLocal()
    user = User(
        full_name="Aarav Verma",
        email="aarav.verma@logistics.in",
        hashed_password="hashed_pwd",
        role="Operations Manager",
        is_active=True
    )
    db.add(user)
    
    shipment = Shipment(
        shipment_id="SHP-TEST-999",
        supplier_id="SUP-101",
        origin="Mumbai",
        destination="Bangalore",
        corridor="Mumbai - Bangalore",
        transport_mode="Road",
        distance_km=980.0,
        lead_time_days=4.0,
        weather_severity=8.0,
        supplier_reliability=80.0,
        hub_congestion=65.0,
        inventory_level=5.0,
        order_priority="High",
        status="In Transit",
        risk_probability=78.5,
        expected_delay_days=3.2,
        risk_band="Critical"
    )
    db.add(shipment)
    db.commit()
    db.refresh(user)
    db.refresh(shipment)
    
    token = create_access_token(user.id)
    return {"token": token, "user": user, "shipment": shipment}

def test_decision_lifecycle_and_outcome(auth_context):
    token = auth_context["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Commit Manager Decision
    decision_payload = {
        "scope": "Single Shipment",
        "shipment_id": "SHP-TEST-999",
        "action_code": "EXPEDITE_AIR",
        "action_title": "Expedite Shipment via Air Express Freight",
        "rationale": "High monsoon severity detected along Western corridor. Air reroute required to meet manufacturing deadline.",
        "ai_recommendation_rank": 1,
        "expected_effect": "Reduces delay by ~2.5 days",
        "trade_offs": "+35% Cost, 2.5 Days Faster"
    }

    create_res = client.post("/api/v1/decisions", json=decision_payload, headers=headers)
    assert create_res.status_code == 201, create_res.text
    dec_data = create_res.json()
    assert dec_data["decision_id"].startswith("DEC-")
    assert dec_data["user_name"] == "Aarav Verma"
    assert dec_data["status"] == "Committed"

    decision_id = dec_data["decision_id"]

    # 2. List Decisions in Ledger
    list_res = client.get("/api/v1/decisions", headers=headers)
    assert list_res.status_code == 200
    items = list_res.json()
    assert any(d["decision_id"] == decision_id for d in items)

    # 3. Verify Delivery Outcome (Closed-Loop)
    outcome_payload = {
        "actual_delay_days": 0.5,
        "delivered_status": "Delivered"
    }
    outcome_res = client.post(f"/api/v1/decisions/{decision_id}/outcome", json=outcome_payload, headers=headers)
    assert outcome_res.status_code == 200
    assert outcome_res.json()["status"] == "Verified"

    # 4. Check Monitoring Outcomes Endpoint
    outcomes_res = client.get("/api/v1/monitoring/outcomes", headers=headers)
    assert outcomes_res.status_code == 200
    out_data = outcomes_res.json()
    assert out_data["total_delivered"] >= 1
