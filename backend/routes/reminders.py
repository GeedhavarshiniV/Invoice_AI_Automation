from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from database import get_db
from models.invoice import Invoice
from models.client import Client
from models.reminder import Reminder
from models.user import User
from auth_dependency import get_current_user
from services.notifier import send_notification

router = APIRouter(prefix="/reminders", tags=["Deadline Reminders"])


def _initials(name: str) -> str:
    if not name:
        return "?"
    parts = name.strip().split(" ")
    if len(parts) > 1:
        return (parts[0][0] + parts[-1][0]).upper()
    return name[:2].upper()


def _serialize(invoice: Invoice, client: Client, reminders: list) -> dict:
    amount = invoice.total_amount or invoice.amount
    return {
        "id": invoice.invoice_number,
        "raw_id": invoice.id,
        "client": client.name if client else f"Client #{invoice.client_id}",
        "email": client.email if client else None,
        "avatar": _initials(client.name if client else ""),
        "amount": amount,
        "status": invoice.status,
        "due": invoice.due_date.isoformat() if invoice.due_date else None,
        "remindersSent": len(reminders),
        "history": [
            {
                "tone": r.tone,
                "sent": r.sent_at.isoformat() if r.sent_at else None,
            }
            for r in sorted(reminders, key=lambda r: r.sent_at or 0)
        ],
    }


@router.get("/pending")
def get_pending(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    invoices = (
        db.query(Invoice)
        .filter(Invoice.status != "Paid")
        .order_by(Invoice.due_date.asc())
        .all()
    )
    results = []
    for inv in invoices:
        client = db.query(Client).filter(Client.id == inv.client_id).first()
        reminders = db.query(Reminder).filter(Reminder.invoice_id == inv.id).all()
        results.append(_serialize(inv, client, reminders))
    return results


class SendReminderRequest(BaseModel):
    tone: str  # "Friendly" | "Firm" | "Urgent"
    message: str


@router.post("/{invoice_id}/send")
def send_reminder(
    invoice_id: int,
    payload: SendReminderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.tone not in ("Friendly", "Firm", "Urgent"):
        raise HTTPException(status_code=400, detail="tone must be Friendly, Firm, or Urgent")

    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    client = db.query(Client).filter(Client.id == invoice.client_id).first()

    reminder = Reminder(
        invoice_id=invoice.id,
        tone=payload.tone,
        message=payload.message,
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)

    send_notification("deadline_reminder", {
        "client_name": client.name if client else "Unknown",
        "invoice_number": invoice.invoice_number,
        "tone": payload.tone,
        "message": payload.message,
        "email": client.email if client else None,
    })

    reminders = db.query(Reminder).filter(Reminder.invoice_id == invoice.id).all()
    return _serialize(invoice, client, reminders)