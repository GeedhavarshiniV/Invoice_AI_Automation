from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.invoice import Invoice
from models.client import Client
from models.user import User
from schemas.schemas import InvoiceCreate, InvoiceOut, InvoiceStatusUpdate
from auth_dependency import get_current_user
from typing import List
from datetime import datetime

router = APIRouter(prefix="/invoices", tags=["Invoices"])


def generate_invoice_number(db):
    count = db.query(Invoice).count()
    return f"INV-{1000 + count + 1}"


@router.get("/", response_model=List[InvoiceOut])
def get_invoices(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Invoice).order_by(Invoice.created_at.desc()).all()


@router.get("/{invoice_id}", response_model=InvoiceOut)
def get_invoice(invoice_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice


@router.post("/", response_model=InvoiceOut)
def create_invoice(invoice: InvoiceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not db.query(Client).filter(Client.id == invoice.client_id).first():
        raise HTTPException(status_code=404, detail="Client not found")
    new_invoice = Invoice(invoice_number=generate_invoice_number(db), client_id=invoice.client_id, amount=invoice.amount, description=invoice.description, due_date=invoice.due_date, status="Pending")
    db.add(new_invoice)
    db.commit()
    db.refresh(new_invoice)
    return new_invoice


@router.patch("/{invoice_id}/status", response_model=InvoiceOut)
def update_status(invoice_id: int, update: InvoiceStatusUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    invoice.status = update.status
    if update.status == "Paid":
        invoice.paid_date = datetime.utcnow()
    db.commit()
    db.refresh(invoice)
    return invoice


@router.delete("/{invoice_id}")
def delete_invoice(invoice_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    db.delete(invoice)
    db.commit()
    return {"message": "Invoice deleted"}