from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models.invoice import Invoice
from models.client import Client
from models.user import User
from models.audit_log import AuditLog
from models.ai_log import AILog
from schemas.schemas import InvoiceCreate, InvoiceOut, InvoiceStatusUpdate, InvoiceUpdate
from auth_dependency import get_current_user
from typing import List
from datetime import datetime
import json

router = APIRouter(prefix="/invoices", tags=["Invoices"])


def generate_invoice_number(db: Session) -> str:
    count = db.query(func.count(Invoice.id)).scalar()
    return f"INV-{1000 + count + 1}"


def _log_audit(db, user_id, action, record_id, old=None, new=None):
    db.add(AuditLog(
        user_id=user_id,
        action=action,
        table_name="invoices",
        record_id=record_id,
        old_value=json.dumps(old, default=str) if old else None,
        new_value=json.dumps(new, default=str) if new else None,
    ))


@router.get("/", response_model=List[InvoiceOut])
def get_invoices(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Invoice).filter(Invoice.user_id == current_user.id).order_by(Invoice.created_at.desc()).all()


@router.get("/{invoice_id}", response_model=InvoiceOut)
def get_invoice(invoice_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.user_id == current_user.id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice


@router.post("/", response_model=InvoiceOut)
def create_invoice(invoice: InvoiceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Client must belong to the current user
    client = db.query(Client).filter(Client.id == invoice.client_id, Client.user_id == current_user.id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    new_invoice = Invoice(
        invoice_number=generate_invoice_number(db),
        user_id=current_user.id,
        client_id=invoice.client_id,
        amount=invoice.amount,
        tax=invoice.tax or 0,
        description=invoice.description,
        due_date=invoice.due_date,
        status=invoice.status or "Pending",
    )
    db.add(new_invoice)
    db.commit()
    db.refresh(new_invoice)

    _log_audit(db, current_user.id, "created", new_invoice.id,
               new={"invoice_number": new_invoice.invoice_number, "amount": str(new_invoice.amount)})
    db.commit()

    return new_invoice


@router.put("/{invoice_id}", response_model=InvoiceOut)
def update_invoice(invoice_id: int, update: InvoiceUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.user_id == current_user.id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    old = {"amount": str(invoice.amount), "status": invoice.status}
    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(invoice, field, value)

    db.commit()
    db.refresh(invoice)

    _log_audit(db, current_user.id, "updated", invoice.id, old=old, new=update.model_dump(exclude_unset=True, mode="json"))
    db.commit()

    return invoice


@router.patch("/{invoice_id}/status", response_model=InvoiceOut)
def update_status(invoice_id: int, update: InvoiceStatusUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    valid_statuses = {"Draft", "Sent", "Pending", "Paid", "Overdue", "Cancelled"}
    if update.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    invoice = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.user_id == current_user.id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    old_status = invoice.status
    invoice.status = update.status
    if update.status == "Paid":
        invoice.paid_date = datetime.utcnow()

    db.commit()
    db.refresh(invoice)

    _log_audit(db, current_user.id, "status_changed", invoice.id,
               old={"status": old_status}, new={"status": update.status})
    db.commit()

    return invoice


@router.delete("/{invoice_id}")
def delete_invoice(invoice_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.user_id == current_user.id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    _log_audit(db, current_user.id, "deleted", invoice.id,
               old={"invoice_number": invoice.invoice_number, "amount": str(invoice.amount)})
    db.delete(invoice)
    db.commit()

    return {"message": "Invoice deleted"}