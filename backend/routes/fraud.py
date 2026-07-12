from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from database import get_db
from models.invoice import Invoice
from models.client import Client
from models.user import User
from auth_dependency import get_current_user
from services.fraud_engine import analyze_invoice, get_flagged_invoices
from services.notifier import send_notification

router = APIRouter(prefix="/fraud", tags=["Fraud Detection"])


def _initials(name: str) -> str:
    if not name:
        return "?"
    parts = name.strip().split(" ")
    if len(parts) > 1:
        return (parts[0][0] + parts[-1][0]).upper()
    return name[:2].upper()


def _serialize(invoice: Invoice, client: Client, analysis: dict) -> dict:
    amount = invoice.total_amount or invoice.amount
    return {
        "id": invoice.invoice_number,
        "raw_id": invoice.id,
        "client": client.name if client else f"Client #{invoice.client_id}",
        "email": client.email if client else None,
        "avatar": _initials(client.name if client else ""),
        "isNewClient": analysis["is_new_client"],
        "amount": amount,
        "status": invoice.status,
        "due": invoice.due_date.isoformat() if invoice.due_date else None,
        "issued": invoice.issued_date.isoformat() if invoice.issued_date else None,
        "paid": invoice.paid_date.isoformat() if invoice.paid_date else None,
        "score": analysis["score"],
        "signals": analysis["signals"],
        "decision": invoice.fraud_decision,
    }


@router.get("/flagged")
def get_flagged(
    min_score: float = 35.0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    flagged = get_flagged_invoices(db, min_score=min_score)
    results = []
    for invoice, analysis in flagged:
        client = db.query(Client).filter(Client.id == invoice.client_id).first()
        results.append(_serialize(invoice, client, analysis))
    return results


@router.get("/{invoice_id}/analyze")
def analyze_single(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    client = db.query(Client).filter(Client.id == invoice.client_id).first()
    analysis = analyze_invoice(invoice, db)
    return _serialize(invoice, client, analysis)


class FraudDecision(BaseModel):
    decision: str  # "clear" | "fraud"


@router.post("/{invoice_id}/decision")
def set_decision(
    invoice_id: int,
    payload: FraudDecision,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.decision not in ("clear", "fraud"):
        raise HTTPException(status_code=400, detail="decision must be 'clear' or 'fraud'")

    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    invoice.fraud_decision = payload.decision
    db.commit()
    db.refresh(invoice)

    if payload.decision == "fraud":
        client = db.query(Client).filter(Client.id == invoice.client_id).first()
        send_notification("fraud_flagged", {
            "client_name": client.name if client else "Unknown",
            "invoice_number": invoice.invoice_number,
            "amount": invoice.total_amount or invoice.amount,
            "email": client.email if client else None,
        })

    return {"id": invoice.id, "invoice_number": invoice.invoice_number, "decision": invoice.fraud_decision}