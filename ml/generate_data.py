import os
import random
import numpy as np
import pandas as pd
from pathlib import Path
from scipy.special import expit

# Indian logistics corridors definition
CORRIDORS = [
    {"origin": "Mumbai", "destination": "Bangalore", "corridor": "Mumbai - Bangalore", "base_distance": 980, "modes": ["Road", "Rail", "Air"]},
    {"origin": "Delhi NCR", "destination": "Mumbai", "corridor": "Delhi NCR - Mumbai", "base_distance": 1420, "modes": ["Road", "Rail", "Air"]},
    {"origin": "Bangalore", "destination": "Chennai", "corridor": "Bangalore - Chennai", "base_distance": 350, "modes": ["Road", "Rail", "Air"]},
    {"origin": "Ahmedabad", "destination": "Nagpur", "corridor": "Ahmedabad - Nagpur", "base_distance": 860, "modes": ["Road", "Rail"]},
    {"origin": "Kolkata", "destination": "Hyderabad", "corridor": "Kolkata - Hyderabad", "base_distance": 1480, "modes": ["Road", "Rail", "Air"]},
    {"origin": "Mundra Port", "destination": "Delhi NCR", "corridor": "Mundra Port - Delhi NCR", "base_distance": 1120, "modes": ["Rail", "Road", "Sea"]},
    {"origin": "JNPT Mumbai", "destination": "Pune", "corridor": "JNPT Mumbai - Pune", "base_distance": 150, "modes": ["Road", "Rail"]},
    {"origin": "Chennai", "destination": "Hyderabad", "corridor": "Chennai - Hyderabad", "base_distance": 630, "modes": ["Road", "Rail", "Air"]},
    {"origin": "Delhi NCR", "destination": "Kolkata", "corridor": "Delhi NCR - Kolkata", "base_distance": 1530, "modes": ["Road", "Rail", "Air"]},
    {"origin": "Mumbai", "destination": "Cochin", "corridor": "Mumbai - Cochin", "base_distance": 1350, "modes": ["Sea", "Road", "Air"]},
    {"origin": "Vizag Port", "destination": "Nagpur", "corridor": "Vizag Port - Nagpur", "base_distance": 780, "modes": ["Rail", "Road"]},
    {"origin": "Hyderabad", "destination": "Bangalore", "corridor": "Hyderabad - Bangalore", "base_distance": 570, "modes": ["Road", "Rail", "Air"]},
]

SUPPLIERS = [
    {"id": "SUP-101", "name": "Tata Logistics Hub", "base_rel": 93.0},
    {"id": "SUP-102", "name": "Adani Integrated Ports", "base_rel": 88.0},
    {"id": "SUP-103", "name": "Reliance Petro Logistics", "base_rel": 85.0},
    {"id": "SUP-104", "name": "BlueDart Prime Express", "base_rel": 96.0},
    {"id": "SUP-105", "name": "Safexpress Regional", "base_rel": 75.0},
    {"id": "SUP-106", "name": "Delhivery Express Line", "base_rel": 82.0},
    {"id": "SUP-107", "name": "VRL Logistics Fleet", "base_rel": 73.0},
    {"id": "SUP-108", "name": "Gati-KWE Intermodal", "base_rel": 70.0},
]

PRIORITIES = ["Standard", "High", "Critical"]
PRIORITY_WEIGHTS = [0.60, 0.28, 0.12]

def generate_synthetic_dataset(num_samples: int = 5000, seed: int = 42) -> pd.DataFrame:
    """
    Generate realistic synthetic supply chain telemetry across Indian corridors.
    Physics-informed delay simulation calibrated to approximately:
    ~40% Low risk, ~30% Medium risk, ~20% High risk, ~10% Critical risk.
    """
    random.seed(seed)
    np.random.seed(seed)

    rows = []
    
    for i in range(1, num_samples + 1):
        shipment_id = f"SHP-{10000 + i}"
        corridor_info = random.choice(CORRIDORS)
        supplier = random.choice(SUPPLIERS)
        transport_mode = random.choice(corridor_info["modes"])
        order_priority = random.choices(PRIORITIES, weights=PRIORITY_WEIGHTS)[0]

        # Distance with minor GPS/routing variance (+- 5%)
        distance_km = round(corridor_info["base_distance"] * (1 + np.random.uniform(-0.05, 0.05)), 1)
        
        # Nominal lead time in days based on transport mode and distance
        if transport_mode == "Air":
            nominal_lead_time = round(max(1.0, (distance_km / 1200.0) + np.random.uniform(0.5, 1.2)), 1)
        elif transport_mode == "Road":
            nominal_lead_time = round(max(1.5, (distance_km / 380.0) + np.random.uniform(0.8, 1.8)), 1)
        elif transport_mode == "Rail":
            nominal_lead_time = round(max(2.0, (distance_km / 450.0) + np.random.uniform(1.0, 2.2)), 1)
        else: # Sea
            nominal_lead_time = round(max(4.0, (distance_km / 220.0) + np.random.uniform(2.0, 4.0)), 1)

        # Weather severity: 0 to 10 scale (beta distribution skewed toward lower numbers with occasional severe spikes)
        weather_severity = round(float(np.random.beta(1.8, 4.2) * 10.0), 1)
        
        # Supplier reliability around supplier's base with variance
        supplier_reliability = round(float(np.clip(np.random.normal(supplier["base_rel"], 4.5), 50.0, 99.0)), 1)
        
        # Hub congestion (0 to 100): bimodal (normal vs peak congestion)
        if np.random.rand() < 0.20:
            hub_congestion = round(float(np.clip(np.random.normal(75.0, 10.0), 50.0, 99.0)), 1)
        else:
            hub_congestion = round(float(np.clip(np.random.normal(30.0, 12.0), 5.0, 60.0)), 1)
            
        # Inventory buffer level (days of buffer stock available)
        inventory_level = round(float(np.clip(np.random.exponential(scale=12.0) + 3.0, 2.0, 45.0)), 1)

        # Calibrated latent delay risk formula:
        # Weather impact
        weather_coeff = 0.38 if transport_mode in ["Air", "Sea"] else 0.30
        w_term = (weather_severity - 2.8) * weather_coeff

        # Congestion impact
        cong_coeff = 0.032 if transport_mode in ["Sea", "Road"] else 0.022
        c_term = (hub_congestion - 32.0) * cong_coeff

        # Supplier reliability impact
        s_term = (85.0 - supplier_reliability) * 0.035

        # Distance & Mode factor
        d_term = ((distance_km - 800.0) / 1000.0) * (0.35 if transport_mode == "Road" else 0.15)

        # Buffer stock & priority offset
        b_term = (inventory_level - 14.0) * 0.032
        p_offset = 0.25 if order_priority == "Critical" else (0.10 if order_priority == "High" else 0.0)

        # Composite logit score
        logit_score = (
            w_term +
            c_term +
            s_term +
            d_term -
            b_term -
            p_offset +
            np.random.normal(0.0, 0.40)
        )

        # Calibrated true delay probability
        true_prob = float(expit(1.18 * logit_score - 0.70))

        # Binary delay event
        is_delayed = bool(np.random.rand() < true_prob)

        if is_delayed:
            # Expected delay duration
            actual_delay_days = round(float(np.clip(1.0 + 3.2 * true_prob + np.random.exponential(1.0), 1.0, 12.0)), 1)
        else:
            actual_delay_days = 0.0

        rows.append({
            "shipment_id": shipment_id,
            "supplier_id": supplier["id"],
            "supplier_name": supplier["name"],
            "origin": corridor_info["origin"],
            "destination": corridor_info["destination"],
            "corridor": corridor_info["corridor"],
            "transport_mode": transport_mode,
            "distance_km": distance_km,
            "lead_time_days": nominal_lead_time,
            "weather_severity": weather_severity,
            "supplier_reliability": supplier_reliability,
            "hub_congestion": hub_congestion,
            "inventory_level": inventory_level,
            "order_priority": order_priority,
            "actual_delay_days": actual_delay_days,
            "delayed": int(is_delayed)
        })

    df = pd.DataFrame(rows)
    return df

if __name__ == "__main__":
    out_dir = Path(__file__).resolve().parent / "data"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / "shipments_seed.csv"
    
    print("Generating 5,000 calibrated synthetic Indian corridor logistics records...")
    df = generate_synthetic_dataset(num_samples=5000, seed=42)
    df.to_csv(out_file, index=False)
    print(f"Successfully saved {len(df)} records to {out_file}")
    print(f"Overall delay rate: {df['delayed'].mean() * 100:.2f}% | Mean delay days (delayed): {df[df['delayed'] == 1]['actual_delay_days'].mean():.2f} days")
