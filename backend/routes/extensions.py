from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.extension import Extension
from models.invoice import Invoice
from models.client import Client
from models.user import User
from schemas.schemas import ExtensionCreate, ExtensionOut
from services.risk_engine import calculate_risk_score, get_suggested_extension_days, get_risk_level, generate_extension_message
from services.notifier import notify_extension_approved
from auth_dependency import get_current_user
from datetime import timedelta
from typing import List

router = APIRouter(prefix="/extensions", tags=["Extensions"])


@router.get("/", response_model=List[ExtensionOut])
def get_extensions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Extension).order_by(Extension.created_at.desc()).all()


@router.get("/analyze/{invoice_id}")
def analyze_invoice(invoice_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    client = db.query(Client).filter(Client.id == invoice.client_id).first()
    risk_score = calculate_risk_score(invoice.client_id, db)
    suggestion = get_suggested_extension_days(risk_score)
    return {"invoice_id": invoice_id, "invoice_number": invoice.invoice_number, "client_name": client.name, "amount": invoice.amount, "due_date": invoice.due_date, "risk_score": risk_score, "risk_level": get_risk_level(risk_score), "suggested_days": suggestion["days"], "suggestion_reason": suggestion["reason"]}


@router.post("/", response_model=ExtensionOut)
def create_extension(ext: ExtensionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    invoice = db.query(Invoice).filter(Invoice.id == ext.invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    client = db.query(Client).filter(Client.id == invoice.client_id).first()
    risk_score = calculate_risk_score(invoice.client_id, db)
    risk_level = get_risk_level(risk_score)
    new_due_date = invoice.due_date + timedelta(days=ext.days_extended)
    ai_message = generate_extension_message(client.name, ext.days_extended, risk_level, invoice.amount)
    extension = Extension(invoice_id=ext.invoice_id, original_due_date=invoice.due_date, new_due_date=new_due_date, days_extended=ext.days_extended, reason=ext.reason, risk_score=risk_score, status="Approved", ai_message=ai_message)
    invoice.due_date = new_due_date
    db.add(extension)
    db.commit()
    db.refresh(extension)
    notify_extension_approved(client.name, invoice.invoice_number, str(new_due_date), client.email)
    return extension