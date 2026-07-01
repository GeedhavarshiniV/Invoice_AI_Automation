from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db

from models.extension import Extension
from models.invoice import Invoice
from models.client import Client
from models.user import User
from models.ai_log import AILog

from schemas.schemas import ExtensionCreate, ExtensionOut

from services.risk_engine import (
    calculate_risk_score,
    get_suggested_extension_days,
    get_risk_level,
    generate_extension_message
)

from services.notifier import notify_extension_approved

from auth_dependency import get_current_user

from datetime import timedelta
from typing import List


router = APIRouter(
    prefix="/extensions",
    tags=["Extensions"]
)


# ---------------------------------------------------
# GET ALL EXTENSIONS
# ---------------------------------------------------

@router.get("/", response_model=List[ExtensionOut])
def get_extensions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    return (
        db.query(Extension)
        .join(
            Invoice,
            Extension.invoice_id == Invoice.id
        )
        .filter(
            Invoice.user_id == current_user.id
        )
        .order_by(
            Extension.created_at.desc()
        )
        .all()
    )


# ---------------------------------------------------
# ANALYZE INVOICE FOR EXTENSION
# ---------------------------------------------------

@router.get("/analyze/{invoice_id}")
def analyze_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    invoice = (
        db.query(Invoice)
        .filter(
            Invoice.id == invoice_id,
            Invoice.user_id == current_user.id
        )
        .first()
    )

    if not invoice:
        raise HTTPException(
            status_code=404,
            detail="Invoice not found"
        )


    client = (
        db.query(Client)
        .filter(Client.id == invoice.client_id)
        .first()
    )


    risk_score = calculate_risk_score(
        invoice.client_id,
        db
    )

    suggestion = get_suggested_extension_days(
        risk_score
    )


    return {

        "invoice_id": invoice.id,

        "invoice_number": invoice.invoice_number,

        "client_name": client.name if client else None,

        "amount": float(invoice.amount),

        "due_date": invoice.due_date,

        "risk_score": risk_score,

        "risk_level": get_risk_level(risk_score),

        "suggested_days": suggestion["days"],

        "suggestion_reason": suggestion["reason"]

    }



# ---------------------------------------------------
# CREATE EXTENSION REQUEST
# ---------------------------------------------------

@router.post("/", response_model=ExtensionOut)
def create_extension(
    ext: ExtensionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):


    # Check invoice belongs to user

    invoice = (
        db.query(Invoice)
        .filter(
            Invoice.id == ext.invoice_id,
            Invoice.user_id == current_user.id
        )
        .first()
    )


    if not invoice:
        raise HTTPException(
            status_code=404,
            detail="Invoice not found"
        )


    # Get client

    client = (
        db.query(Client)
        .filter(
            Client.id == invoice.client_id
        )
        .first()
    )


    # Risk calculation

    risk_score = calculate_risk_score(
        invoice.client_id,
        db
    )


    risk_level = get_risk_level(
        risk_score
    )


    # Calculate new due date

    new_due_date = (
        invoice.due_date +
        timedelta(days=ext.requested_days)
    )


    # AI message

    ai_message = generate_extension_message(
        client.name if client else "Customer",
        ext.requested_days,
        risk_level,
        float(invoice.amount)
    )


    # Create extension record

    extension = Extension(

        invoice_id=invoice.id,

        original_due_date=invoice.due_date,

        old_due_date=invoice.due_date,

        new_due_date=new_due_date,

        days_extended=ext.requested_days,

        requested_days=ext.requested_days,

        risk_score=risk_score,

        status="Approved",

        ai_generated_message=ai_message,

        reason=ext.reason,

        approved_by=current_user.id

    )


    db.add(extension)

    db.commit()

    db.refresh(extension)


    # Optional notification

    try:

        notify_extension_approved(
            invoice,
            extension
        )

    except Exception:

        pass



    return extension