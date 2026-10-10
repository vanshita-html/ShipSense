import sys
from pathlib import Path
import pandas as pd
from sqlalchemy.orm import Session

# Add paths
ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.core.database import SessionLocal, Base, engine
from app.models.shipment import Shipment
from app.models.metric import PipelineRun
from app.services.ml_service import ml_service
from ml.train import train_models
from ml.generate_data import generate_synthetic_dataset

def seed_database(num_records: int = 250):
    """
    Seed initial shipments into SQLite database and ensure ML models are trained.
    DOES NOT create any user accounts.
    """
    print("Step 1: Creating database schema if not exists...")
    Base.metadata.create_all(bind=engine)

    data_dir = ROOT_DIR / "ml" / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    csv_path = data_dir / "shipments_seed.csv"

    print("Step 2: Training ML models (XGBoost Classifier + Regressor)...")
    train_models(data_path=csv_path, models_dir=ROOT_DIR / "ml" / "models")

    print(f"Step 3: Populating initial {num_records} active shipments into SQLite...")
    df = pd.read_csv(csv_path).head(num_records)

    db: Session = SessionLocal()
    try:
        # Clear existing shipments to ensure a clean initial state
        db.query(Shipment).delete()
        db.commit()

        count = 0
        for _, row in df.iterrows():
            shipment_dict = {
                "shipment_id": row["shipment_id"],
                "supplier_id": row["supplier_id"],
                "supplier_name": row["supplier_name"],
                "origin": row["origin"],
                "destination": row["destination"],
                "corridor": row["corridor"],
                "transport_mode": row["transport_mode"],
                "distance_km": float(row["distance_km"]),
                "lead_time_days": float(row["lead_time_days"]),
                "weather_severity": float(row["weather_severity"]),
                "supplier_reliability": float(row["supplier_reliability"]),
                "hub_congestion": float(row["hub_congestion"]),
                "inventory_level": float(row["inventory_level"]),
                "order_priority": row["order_priority"],
            }

            pred = ml_service.predict_and_explain(shipment_dict)

            # Assign realistic statuses
            if count < 180:
                stat = "In Transit"
                actual_delay = None
                delayed_val = None
                outcome = None
            elif count < 220:
                stat = "Delivered"
                actual_delay = float(row["actual_delay_days"])
                delayed_val = bool(row["delayed"])
                pred_del = pred["risk_probability"] >= 50.0
                outcome = "Correct Prediction" if pred_del == delayed_val else ("Overpredicted" if pred_del else "Underpredicted")
            else:
                stat = "At Hub"
                actual_delay = None
                delayed_val = None
                outcome = None

            shipment = Shipment(
                shipment_id=row["shipment_id"],
                supplier_id=row["supplier_id"],
                supplier_name=row["supplier_name"],
                origin=row["origin"],
                destination=row["destination"],
                corridor=row["corridor"],
                transport_mode=row["transport_mode"],
                distance_km=float(row["distance_km"]),
                lead_time_days=float(row["lead_time_days"]),
                weather_severity=float(row["weather_severity"]),
                supplier_reliability=float(row["supplier_reliability"]),
                hub_congestion=float(row["hub_congestion"]),
                inventory_level=float(row["inventory_level"]),
                order_priority=row["order_priority"],
                status=stat,
                risk_probability=pred["risk_probability"],
                expected_delay_days=pred["expected_delay_days"],
                risk_band=pred["risk_band"],
                actual_delay_days=actual_delay,
                delayed=delayed_val,
                outcome_status=outcome
            )
            shipment.shap_drivers = pred.get("shap_drivers", [])
            db.add(shipment)
            count += 1

        db.add(PipelineRun(
            stage="Seed Data Ingestion",
            status="SUCCESS",
            message=f"Seeded {count} active telemetry records across Indian corridors.",
            duration_ms=45.0,
            records_processed=count
        ))

        db.commit()
        print(f"Successfully seeded {count} shipments into SQLite database (No user accounts created).")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
