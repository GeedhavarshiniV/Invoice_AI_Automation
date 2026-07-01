from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models.payment import Payment
from models.invoice import Invoice
from models.user import User
from models.audit_log import AuditLog
from schemas.schemas import PaymentCreate, PaymentOut
from auth_dependency import get_current_user
from typing import List
import json

router = APIRouter(prefix="/payments", tags=["Payments"])


def _log_audit(db, user_id, action, record_id, new=None):
    db.add(AuditLog(
        user_id=user_id,
        action=action,
        table_name="payments",
        record_id=record_id,
        new_value=json.dumps(new, default=str) if new else None,
    ))


@router.post("/", response_model=PaymentOut)
def add_payment(payment: PaymentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    invoice = db.query(Invoice).filter(Invoice.id == payment.invoice_id, Invoice.user_id == current_user.id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    new_payment = Payment(
        invoice_id=payment.invoice_id,
        amount_paid=payment.amount_paid,
        payment_method=payment.payment_method,
        transaction_id=payment.transaction_id,
        status="Success",
    )
    db.add(new_payment)
    db.flush()  # get new_payment.id before commit

    # Auto-update invoice status if fully paid
    total_paid = db.query(func.sum(Payment.amount_paid)).filter(
        Payment.invoice_id == payment.invoice_id,
        Payment.status == "Success"
    ).scalar() or 0

    total_due = float(invoice.amount) + float(invoice.tax)
    if float(total_paid) >= total_due:
        invoice.status = "Paid"
        from datetime import datetime
        invoice.paid_date = datetime.utcnow()

    db.commit()
    db.refresh(new_payment)

    _log_audit(db, current_user.id, "payment_added", new_payment.id,
               new={"invoice_id": payment.invoice_id, "amount_paid": str(payment.amount_paid)})
    db.commit()

    return new_payment


@router.get("/{invoice_id}", response_model=List[PaymentOut])
def get_payments(invoice_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.user_id == current_user.id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    return db.query(Payment).filter(Payment.invoice_id == invoice_id).order_by(Payment.payment_date.desc()).all()