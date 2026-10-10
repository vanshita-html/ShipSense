from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.shipment import Shipment
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/risk", tags=["Risk Analytics"])

@router.get("/summary")
def get_risk_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Aggregate high-level supply chain risk statistics & briefing."""
    total_count = db.query(Shipment).count()
    if total_count == 0:
        return {
            "total_shipments": 0,
            "high_risk_count": 0,
            "critical_risk_count": 0,
            "high_or_critical_pct": 0.0,
            "avg_risk_probability": 0.0,
            "avg_expected_delay_days": 0.0,
            "batch_exposure_score": 0.0,
            "escalation_score": 0.0,
            "risk_bands": {"Low": 0, "Medium": 0, "High": 0, "Critical": 0},
            "ai_daily_briefing": "No telemetry records currently ingested into ShipSense.",
            "data_notice": "Simulated Indian logistics corridor telemetry."
        }

    # Counts by band
    bands_raw = db.query(Shipment.risk_band, func.count(Shipment.id)).group_by(Shipment.risk_band).all()
    risk_bands = {"Low": 0, "Medium": 0, "High": 0, "Critical": 0}
    for band, count in bands_raw:
        if band in risk_bands:
            risk_bands[band] = count

    high_count = risk_bands["High"]
    critical_count = risk_bands["Critical"]
    high_crit_pct = round(((high_count + critical_count) / total_count) * 100.0, 1)

    avg_prob = db.query(func.avg(Shipment.risk_probability)).scalar() or 0.0
    avg_delay = db.query(func.avg(Shipment.expected_delay_days)).scalar() or 0.0

    # Batch Exposure Score = (High Count * 1.5 + Critical Count * 3.2) / total * 25
    batch_exposure = round(min(100.0, ((high_count * 1.5 + critical_count * 3.2) / max(1, total_count)) * 28.0), 1)

    # Escalation Score = Critical count * 5 + High count * 2
    escalation_score = round(min(100.0, (critical_count * 4.5 + high_count * 1.8)), 1)

    low_count = risk_bands["Low"]
    med_count = risk_bands["Medium"]
    low_pct = round((low_count / max(1, total_count)) * 100.0, 1)
    med_pct = round((med_count / max(1, total_count)) * 100.0, 1)
    high_pct = round((high_count / max(1, total_count)) * 100.0, 1)
    crit_pct = round((critical_count / max(1, total_count)) * 100.0, 1)

    # Concise AI Daily Briefing (2-3 sentences max) based on live data
    if high_crit_pct > 35.0:
        briefing = (
            f"Alert: {high_crit_pct}% of consignments ({critical_count} critical, {high_count} high) exceed target risk thresholds. "
            f"Average delay exposure is {avg_delay:.1f} days due to localized weather and hub congestion. "
            f"Prescriptive mitigation actions are ready for manager sign-off."
        )
    elif high_crit_pct > 18.0:
        briefing = (
            f"Operations stable: {round(low_pct + med_pct, 1)}% of shipments ({low_count + med_count} consignments) are nominal or moderate risk. "
            f"Elevated risk is isolated to {high_count + critical_count} shipments with average delay contained at {avg_delay:.1f} days. "
            f"Major freight rail corridors continue fluid dispatch."
        )
    else:
        briefing = (
            f"Optimal flow: {low_pct}% of shipments are low risk with mean delay held at {avg_delay:.1f} days across all 12 corridors. "
            f"Terminal throughput and highway fluidities remain within baseline SLAs."
        )

    return {
        "total_shipments": total_count,
        "high_risk_count": high_count,
        "critical_risk_count": critical_count,
        "high_or_critical_pct": high_crit_pct,
        "avg_risk_probability": round(float(avg_prob), 1),
        "avg_expected_delay_days": round(float(avg_delay), 1),
        "batch_exposure_score": batch_exposure,
        "escalation_score": escalation_score,
        "risk_bands": risk_bands,
        "ai_daily_briefing": briefing,
        "data_notice": "Simulated Indian logistics corridor telemetry."
    }

@router.get("/by-corridor")
def get_risk_by_corridor(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Aggregate risk profile by logistics corridor."""
    corridor_stats = db.query(
        Shipment.corridor,
        func.count(Shipment.id).label("total"),
        func.avg(Shipment.risk_probability).label("avg_risk"),
        func.avg(Shipment.expected_delay_days).label("avg_delay"),
        func.avg(Shipment.weather_severity).label("avg_weather"),
        func.avg(Shipment.hub_congestion).label("avg_congestion")
    ).group_by(Shipment.corridor).all()

    result = []
    for row in corridor_stats:
        avg_risk = round(float(row.avg_risk or 0), 1)
        band = "Critical" if avg_risk > 70 else ("High" if avg_risk > 50 else ("Medium" if avg_risk > 30 else "Low"))
        result.append({
            "corridor": row.corridor,
            "total_shipments": row.total,
            "avg_risk_probability": avg_risk,
            "avg_expected_delay_days": round(float(row.avg_delay or 0), 1),
            "avg_weather_severity": round(float(row.avg_weather or 0), 1),
            "avg_hub_congestion": round(float(row.avg_congestion or 0), 1),
            "risk_band": band
        })

    result.sort(key=lambda x: x["avg_risk_probability"], reverse=True)
    return result

@router.get("/by-mode")
def get_risk_by_mode(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Aggregate risk profile by transport mode (Road, Rail, Air, Sea)."""
    mode_stats = db.query(
        Shipment.transport_mode,
        func.count(Shipment.id).label("total"),
        func.avg(Shipment.risk_probability).label("avg_risk"),
        func.avg(Shipment.expected_delay_days).label("avg_delay")
    ).group_by(Shipment.transport_mode).all()

    result = []
    for row in mode_stats:
        avg_risk = round(float(row.avg_risk or 0), 1)
        result.append({
            "transport_mode": row.transport_mode,
            "total_shipments": row.total,
            "avg_risk_probability": avg_risk,
            "avg_expected_delay_days": round(float(row.avg_delay or 0), 1),
            "risk_band": "Critical" if avg_risk > 70 else ("High" if avg_risk > 50 else ("Medium" if avg_risk > 30 else "Low"))
        })

    return result
