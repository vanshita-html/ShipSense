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

# Use in-memory SQLite for isolated test suite
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

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_register_and_login_flow():
    # 1. Register new user
    user_data = {
        "full_name": "Rohan Sharma",
        "email": "rohan.sharma@logistics.in",
        "password": "SecurePassword123!",
        "confirm_password": "SecurePassword123!",
        "role": "Operations Manager",
        "company_name": "Apex Cargo India"
    }
    reg_res = client.post("/api/v1/auth/register", json=user_data)
    assert reg_res.status_code == 201, reg_res.text
    data = reg_res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "rohan.sharma@logistics.in"
    assert data["user"]["role"] == "Operations Manager"

    # 2. Duplicate registration fails
    dup_res = client.post("/api/v1/auth/register", json=user_data)
    assert dup_res.status_code == 400

    # 3. Login with correct credentials
    login_res = client.post("/api/v1/auth/login", json={
        "email": "rohan.sharma@logistics.in",
        "password": "SecurePassword123!"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    assert token is not None

    # 4. Access protected route /me with Bearer token
    me_res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "rohan.sharma@logistics.in"

    # 5. Login with invalid password
    bad_login = client.post("/api/v1/auth/login", json={
        "email": "rohan.sharma@logistics.in",
        "password": "WrongPassword!"
    })
    assert bad_login.status_code == 401

def test_forgot_password_stub():
    res = client.post("/api/v1/auth/forgot-password", json={
        "email": "rohan.sharma@logistics.in"
    })
    assert res.status_code == 200
    assert "dispatch" in res.json()["message"].lower() or "reset" in res.json()["message"].lower()
