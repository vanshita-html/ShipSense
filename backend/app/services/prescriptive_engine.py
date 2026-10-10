import uuid
from typing import Any, Dict, List

ACTION_TEMPLATES = [
    {
        "code": "EXPEDITE_AIR",
        "title": "Expedite Shipment via Air Express Freight",
        "target_driver": "weather_severity",
        "urgency": "Immediate (within 4h)",
        "base_cost": "+35% (High)",
        "base_time": "-65% Lead Time (~2.5 days faster)",
        "feasibility": "High (Air corridors operational)",
        "effect_desc": "Bypasses ground roadblocks and monsoon bottlenecks, slashing transit time."
    },
    {
        "code": "REROUTE_CORRIDOR",
        "title": "Dynamic Corridor Rerouting via Alternate Hub",
        "target_driver": "hub_congestion",
        "urgency": "High (within 12h)",
        "base_cost": "+12% (Moderate)",
        "base_time": "-30% Lead Time (~1.2 days faster)",
        "feasibility": "Very High (Pre-mapped bypass route)",
        "effect_desc": "Diverts freight around high-congestion hub onto secondary arterial highway."
    },
    {
        "code": "SWITCH_SUPPLIER",
        "title": "Reallocate Order to High-Reliability Regional Carrier",
        "target_driver": "supplier_reliability",
        "urgency": "High (within 12h)",
        "base_cost": "+8% (Low to Moderate)",
        "base_time": "-40% Lead Time (~1.8 days faster)",
        "feasibility": "High (Contracted tier-1 carrier on standby)",
        "effect_desc": "Reassigns payload to top-tier logistics partner (e.g. Tata Logistics / BlueDart) with 95%+ SLA adherence."
    },
    {
        "code": "BUFFER_STOCK",
        "title": "Release Regional Safety Stock Allocation",
        "target_driver": "inventory_level",
        "urgency": "Medium (within 24h)",
        "base_cost": "Neutral (Internal inventory reallocation)",
        "base_time": "Zero delay at final assembly line",
        "feasibility": "Immediate (Available in local warehouse)",
        "effect_desc": "Unlocks downstream safety buffer in destination warehouse to neutralize supply disruption."
    },
    {
        "code": "SWITCH_RAIL",
        "title": "Shift Long-Haul Payload to Dedicated Freight Corridor (DFC Rail)",
        "target_driver": "distance_km",
        "urgency": "Medium (within 24h)",
        "base_cost": "-15% (Cost saving)",
        "base_time": "Predictable scheduled timetable",
        "feasibility": "High (Indian Railways DFC line connected)",
        "effect_desc": "Leverages heavy rail freight corridors immune to regional highway gridlock."
    }
]

class PrescriptiveEngine:
    @staticmethod
    def generate_recommendations(shipment: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate ranked prescriptive mitigation recommendations tailored to SHAP drivers & shipment attributes.
        """
        risk_prob = float(shipment.get("risk_probability", 0))
        expected_days = float(shipment.get("expected_delay_days", 0))
        shap_drivers = shipment.get("shap_drivers", [])
        
        # Determine dominant driver from SHAP
        top_driver_name = "general"
        if shap_drivers and len(shap_drivers) > 0:
            top_pos_driver = next((d for d in shap_drivers if d.get("direction") == "INCREASES_RISK"), shap_drivers[0])
            top_driver_name = top_pos_driver.get("feature", "general")

        recommendations = []

        for template in ACTION_TEMPLATES:
            # Calculate dynamic relevance score based on match with top drivers
            target = template["target_driver"]
            is_primary_match = target in top_driver_name
            
            if is_primary_match:
                relevance = round(min(98.0, 80.0 + (risk_prob * 0.18)), 1)
            else:
                relevance = round(max(45.0, 70.0 - abs(hash(template["code"])) % 25), 1)

            # Synthesize personalized rationale
            rationale_text = (
                f"AI Identified Risk: {top_driver_name.replace('_', ' ').title()} is significantly elevating delay probability "
                f"to {risk_prob}%. {template['effect_desc']}"
            )

            # Calculate estimated impact
            days_saved = round(max(0.5, expected_days * (0.6 if is_primary_match else 0.35)), 1)
            prob_reduction = round(min(65.0, risk_prob * (0.65 if is_primary_match else 0.4)), 1)

            rec = {
                "action_id": f"REC-{uuid.uuid4().hex[:8].upper()}",
                "action_code": template["code"],
                "title": template["title"],
                "urgency": template["urgency"],
                "rationale": rationale_text,
                "expected_effect": f"Reduces delay by ~{days_saved} days (Risk drops -{prob_reduction}%)",
                "trade_offs": {
                    "cost_impact": template["base_cost"],
                    "time_gain": template["base_time"],
                    "feasibility": template["feasibility"]
                },
                "relevance_score": relevance,
                "status": "MANAGER_REVIEW_REQUIRED",
                "guardrail_notice": "Decision Support Mode — Advisory only. Human manager sign-off required."
            }
            recommendations.append(rec)

        # Sort by relevance score descending
        recommendations.sort(key=lambda x: x["relevance_score"], reverse=True)
        return recommendations

prescriptive_engine = PrescriptiveEngine()
