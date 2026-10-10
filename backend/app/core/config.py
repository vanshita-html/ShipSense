import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent
WORKSPACE_DIR = BASE_DIR.parent
ML_DIR = WORKSPACE_DIR / "ml"
ML_MODELS_DIR = ML_DIR / "models"
ML_DATA_DIR = ML_DIR / "data"

class Settings(BaseSettings):
    PROJECT_NAME: str = "ShipSense"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "shipsense_super_secret_production_ready_jwt_key_982347109238409"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Database
    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'shipsense.db'}"
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]
    
    # Simulation Defaults
    DEFAULT_SIMULATION_INTERVAL_SEC: int = 5
    SIMULATION_ENABLED: bool = True
    
    # ML Asset Paths
    ML_DIR: Path = ML_DIR
    ML_MODELS_DIR: Path = ML_MODELS_DIR
    ML_DATA_DIR: Path = ML_DATA_DIR
    CLASSIFIER_PATH: Path = ML_MODELS_DIR / "delay_classifier.joblib"
    REGRESSOR_PATH: Path = ML_MODELS_DIR / "delay_regressor.joblib"
    PREPROCESSOR_PATH: Path = ML_MODELS_DIR / "preprocessor.joblib"
    BASELINE_STATS_PATH: Path = ML_MODELS_DIR / "baseline_stats.json"
    DATASET_PATH: Path = ML_DATA_DIR / "shipments_seed.csv"

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

# Ensure required directories exist
ML_MODELS_DIR.mkdir(parents=True, exist_ok=True)
ML_DATA_DIR.mkdir(parents=True, exist_ok=True)
