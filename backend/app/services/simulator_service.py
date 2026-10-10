import asyncio
import logging
import random
from datetime import datetime, timezone
from typing import Dict, Any, Optional
import numpy as np
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.shipment import Shipment
from app.models.metric import PipelineRun
from app.services.ml_service import ml_service
from ml.generate_data import CORRIDORS, SUPPLIERS, PRIORITIES, PRIORITY_WEIGHTS

logger = logging.getLogger("ShipSenseSimulator")

SCENARIOS = {
    "NORMAL": {
        "name": "Normal Operations",
        "description": "Standard baseline logistics flow with regular operational variability.",
        "weather_mod": 1.0,
        "congestion_mod": 1.0,
        "supplier_rel_mod": 1.0,
    },
    "MONSOON": {
        "name": "Monsoon Disruption",
        "description": "Intense rainfall across Western Ghats and Coastal corridors.",
        "weather_mod": 1.8,
        "congestion_mod": 1.25,
        "supplier_rel_mod": 0.92,
    },
    "PORT_STRIKE": {
        "name": "Port & Customs Bottleneck",
        "description": "Clearance backlog at JNPT, Mundra, and Vizag maritime hubs.",
        "weather_mod": 1.0,
        "congestion_mod": 1.6,
        "supplier_rel_mod": 0.94,
    },
    "FUEL_PRICE_SPIKE": {
        "name": "Fuel Price & Carrier Surcharge",
        "description": "Diesel price inflation impacting road freight schedules.",
        "weather_mod": 1.0,
        "congestion_mod": 1.2,
        "supplier_rel_mod": 0.90,
    }
}

class TelemetrySimulator:
    def __init__(self):
        self.is_running: bool = False
        self.interval_sec: int = settings.DEFAULT_SIMULATION_INTERVAL_SEC
        self.current_scenario: str = "NORMAL"
        self._task: Optional[asyncio.Task] = None

    def set_scenario(self, scenario_key: str):
        key = scenario_key.upper()
        if key in SCENARIOS:
            self.current_scenario = key
            logger.info(f"Simulator scenario switched to: {SCENARIOS[key]['name']}")
            return SCENARIOS[key]
        raise ValueError(f"Unknown scenario preset: {scenario_key}")

    def set_interval(self, interval_sec: int):
        self.interval_sec = max(2, min(60, interval_sec))
        logger.info(f"Simulator interval set to: {self.interval_sec} seconds")
        return {"interval_sec": self.interval_sec}

    def generate_single_telemetry(self) -> Dict[str, Any]:
        """Generate a single live telemetry record with current scenario parameters."""
        scenario = SCENARIOS.get(self.current_scenario, SCENARIOS["NORMAL"])
        corridor_info = random.choice(CORRIDORS)
        supplier = random.choice(SUPPLIERS)
        transport_mode = random.choice(corridor_info["modes"])
        order_priority = random.choices(PRIORITIES, weights=PRIORITY_WEIGHTS)[0]

        distance_km = round(corridor_info["base_distance"] * (1 + random.uniform(-0.04, 0.04)), 1)
        
        # Lead time
        if transport_mode == "Air":
            lead_time = round(max(1.0, (distance_km / 1200.0) + random.uniform(0.5, 1.2)), 1)
        elif transport_mode == "Road":
            lead_time = round(max(1.5, (distance_km / 380.0) + random.uniform(0.8, 1.8)), 1)
        elif transport_mode == "Rail":
            lead_time = round(max(2.0, (distance_km / 450.0) + random.uniform(1.0, 2.2)), 1)
        else:
            lead_time = round(max(4.0, (distance_km / 220.0) + random.uniform(2.0, 4.0)), 1)

        # Weather with scenario modifier
        base_weather = float(np.random.beta(1.8, 4.2) * 10.0)
        weather_severity = round(float(np.clip(base_weather * scenario["weather_mod"], 0.5, 10.0)), 1)

        # Supplier reliability with scenario modifier
        supplier_reliability = round(float(np.clip(supplier["base_rel"] * scenario["supplier_rel_mod"] + random.uniform(-3, 3), 45.0, 99.0)), 1)

        # Hub congestion with scenario modifier
        base_cong = random.uniform(15, 60)
        hub_congestion = round(float(np.clip(base_cong * scenario["congestion_mod"], 10.0, 99.0)), 1)

        # Inventory buffer
        inventory_level = round(float(np.clip(random.expovariate(1/12.0) + 3.0, 2.0, 45.0)), 1)

        shipment_num = random.randint(11000, 99999)
        shipment_dict = {
            "shipment_id": f"SHP-{shipment_num}",
            "supplier_id": supplier["id"],
            "supplier_name": supplier["name"],
            "origin": corridor_info["origin"],
            "destination": corridor_info["destination"],
            "corridor": corridor_info["corridor"],
            "transport_mode": transport_mode,
            "distance_km": distance_km,
            "lead_time_days": lead_time,
            "weather_severity": weather_severity,
            "supplier_reliability": supplier_reliability,
            "hub_congestion": hub_congestion,
            "inventory_level": inventory_level,
            "order_priority": order_priority,
        }

        # Run instant ML prediction & SHAP explanation
        pred_res = ml_service.predict_and_explain(shipment_dict)
        shipment_dict.update(pred_res)
        return shipment_dict

    async def _simulation_loop(self):
        """Asynchronous worker loop continuously updating database telemetry."""
        logger.info("ShipSense Live Telemetry Simulation stream started.")
        while self.is_running:
            try:
                db: Session = SessionLocal()
                try:
                    # 1. Ingest 1-2 new active shipments
                    num_new = random.choice([1, 2])
                    for _ in range(num_new):
                        data = self.generate_single_telemetry()
                        shipment = Shipment(
                            shipment_id=data["shipment_id"],
                            supplier_id=data["supplier_id"],
                            supplier_name=data["supplier_name"],
                            origin=data["origin"],
                            destination=data["destination"],
                            corridor=data["corridor"],
                            transport_mode=data["transport_mode"],
                            distance_km=data["distance_km"],
                            lead_time_days=data["lead_time_days"],
                            weather_severity=data["weather_severity"],
                            supplier_reliability=data["supplier_reliability"],
                            hub_congestion=data["hub_congestion"],
                            inventory_level=data["inventory_level"],
                            order_priority=data["order_priority"],
                            status="In Transit",
                            risk_probability=data["risk_probability"],
                            expected_delay_days=data["expected_delay_days"],
                            risk_band=data["risk_band"],
                            shap_drivers_json=None
                        )
                        shipment.shap_drivers = data.get("shap_drivers", [])
                        db.add(shipment)

                    # 2. Advance existing in-transit shipments to Delivered/Delayed for closed-loop validation
                    active_shipments = db.query(Shipment).filter(Shipment.status == "In Transit").order_by(Shipment.created_at.asc()).limit(3).all()
                    for shp in active_shipments:
                        if random.random() < 0.35:
                            # Deliver shipment
                            if shp.risk_probability > 45:
                                # High probability shipment outcome
                                actual_delay = round(max(0.0, float(shp.expected_delay_days + random.uniform(-0.8, 1.2))), 1)
                                is_delayed = actual_delay >= 1.0
                            else:
                                actual_delay = 0.0 if random.random() < 0.85 else 1.2
                                is_delayed = actual_delay >= 1.0

                            shp.status = "Delivered"
                            shp.actual_delay_days = actual_delay
                            shp.delayed = is_delayed
                            shp.delivered_at = datetime.now(timezone.utc)
                            
                            # Outcome assessment
                            predicted_delayed = shp.risk_probability >= 50.0
                            if predicted_delayed == is_delayed:
                                shp.outcome_status = "Correct Prediction"
                            elif predicted_delayed and not is_delayed:
                                shp.outcome_status = "Overpredicted"
                            else:
                                shp.outcome_status = "Underpredicted"

                    # 3. Record Pipeline Health Step
                    pipe_log = PipelineRun(
                        stage="Telemetry Ingestion & Prediction",
                        status="SUCCESS",
                        message=f"Ingested {num_new} shipments under {self.current_scenario} scenario.",
                        duration_ms=round(random.uniform(18.0, 42.0), 1),
                        records_processed=num_new
                    )
                    db.add(pipe_log)
                    db.commit()

                except Exception as e:
                    db.rollback()
                    logger.error(f"Error in telemetry simulator step: {e}")
                finally:
                    db.close()

            except Exception as e:
                logger.error(f"Unexpected simulation error: {e}")

            await asyncio.sleep(self.interval_sec)

    def start(self):
        if not self.is_running:
            self.is_running = True
            self._task = asyncio.create_task(self._simulation_loop())
            logger.info("Simulator task started.")

    def stop(self):
        if self.is_running:
            self.is_running = False
            if self._task:
                self._task.cancel()
            logger.info("Simulator task stopped.")

simulator_service = TelemetrySimulator()
