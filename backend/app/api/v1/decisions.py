import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.models.decision import Decision
from app.models.shipment import Shipment
from app.schemas.decision import (
    DecisionCreate,
    DecisionResponse,
    OutcomeUpdateRequest
)
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/decisions", tags=["Decision Ledger & Audit Trail"])

@router.post("", response_model=DecisionResponse, status_code=status.HTTP_201_CREATED)
def create_decision(
    payload: DecisionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Commit a manager mitigation decision to the append-only audit ledger.
    Mandatory human rationale required for compliance & closed-loop learning.
    """
    decision_id = f"DEC-{uuid.uuid4().hex[:8].upper()}"

    decision = Decision(
        decision_id=decision_id,
        user_id=current_user.id,
        user_name=current_user.full_name,
        user_email=current_user.email,
        scope=payload.scope,
        shipment_id=payload.shipment_id,
        target_entities=payload.target_entities,
        action_code=payload.action_code,
        action_title=payload.action_title,
        rationale=payload.rationale.strip(),
        ai_recommendation_rank=payload.ai_recommendation_rank,
        expected_effect=payload.expected_effect,
        trade_offs=payload.trade_offs,
        status="Committed"
    )
    db.add(decision)
    db.commit()
    db.refresh(decision)

    return DecisionResponse.model_validate(decision)

@router.get("", response_model=List[DecisionResponse])
def list_decisions(
    shipment_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve immutable timeline of committed managerial mitigation decisions."""
    query = db.query(Decision)
    if shipment_id:
        query = query.filter(Decision.shipment_id == shipment_id)
    
    decisions = query.order_by(desc(Decision.created_at)).limit(limit).all()
    return [DecisionResponse.model_validate(d) for d in decisions]

@router.post("/{decision_id}/outcome")
def update_decision_outcome(
    decision_id: str,
    payload: OutcomeUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Record actual delivery outcome to close the feedback loop."""
    decision = db.query(Decision).filter(Decision.decision_id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Decision {decision_id} not found.")

    decision.status = "Verified"
    
    # Update linked shipment if available
    if decision.shipment_id:
        shipment = db.query(Shipment).filter(Shipment.shipment_id == decision.shipment_id).first()
        if shipment:
            shipment.actual_delay_days = payload.actual_delay_days
            shipment.status = payload.delivered_status
            shipment.delayed = payload.actual_delay_days >= 1.0
            
            predicted_delayed = shipment.risk_probability >= 50.0
            actual_delayed = shipment.delayed
            if predicted_delayed == actual_delayed:
                shipment.outcome_status = "Correct Prediction"
            elif predicted_delayed and not actual_delayed:
                shipment.outcome_status = "Overpredicted"
            else:
                shipment.outcome_status = "Underpredicted"

    db.commit()
    return {
        "message": f"Outcome verified for decision {decision_id}.",
        "status": "Verified",
        "actual_delay_days": payload.actual_delay_days
    }
