from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models.invoice import Invoice
from models.client import Client
from models.payment import Payment
from models.user import User
from auth_dependency import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/summary")
def get_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    uid = current_user.id

    total = db.query(func.sum(Invoice.amount)).filter(Invoice.user_id == uid).scalar() or 0
    paid = db.query(func.sum(Invoice.amount)).filter(Invoice.user_id == uid, Invoice.status == "Paid").scalar() or 0
    pending = db.query(func.sum(Invoice.amount)).filter(Invoice.user_id == uid, Invoice.status == "Pending").scalar() or 0
    overdue = db.query(func.sum(Invoice.amount)).filter(Invoice.user_id == uid, Invoice.status == "Overdue").scalar() or 0

    return {
        "total_billed": float(total),
        "total_collected": float(paid),
        "total_pending": float(pending),
        "total_overdue": float(overdue),
        "collection_rate": round(float(paid) / float(total) * 100, 1) if total > 0 else 0,
        "total_invoices": db.query(Invoice).filter(Invoice.user_id == uid).count(),
        "paid_invoices": db.query(Invoice).filter(Invoice.user_id == uid, Invoice.status == "Paid").count(),
        "pending_invoices": db.query(Invoice).filter(Invoice.user_id == uid, Invoice.status == "Pending").count(),
        "overdue_invoices": db.query(Invoice).filter(Invoice.user_id == uid, Invoice.status == "Overdue").count(),
        "total_clients": db.query(Client).filter(Client.user_id == uid).count(),
    }


@router.get("/top-clients")
def get_top_clients(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    results = (
        db.query(
            Client.id, Client.name, Client.email,
            func.sum(Invoice.amount).label("total_billed"),
            func.count(Invoice.id).label("total_invoices"),
        )
        .join(Invoice, Invoice.client_id == Client.id)
        .filter(Client.user_id == current_user.id)
        .group_by(Client.id)
        .order_by(func.sum(Invoice.amount).desc())
        .limit(5)
        .all()
    )
    return [{"id": r.id, "name": r.name, "email": r.email, "total_billed": float(r.total_billed), "total_invoices": r.total_invoices} for r in results]


@router.get("/monthly")
def get_monthly(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    results = (
        db.query(
            func.date_trunc("month", Invoice.issue_date).label("month"),
            func.sum(Invoice.amount).label("revenue"),
            func.count(Invoice.id).label("invoices"),
        )
        .filter(Invoice.user_id == current_user.id)
        .group_by("month")
        .order_by("month")
        .all()
    )
    return [{"month": str(r.month)[:7], "revenue": float(r.revenue or 0), "invoices": r.invoices} for r in results]


@router.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Single endpoint that powers the frontend dashboard."""
    uid = current_user.id

    summary = get_summary(db=db, current_user=current_user)
    top_clients = get_top_clients(db=db, current_user=current_user)
    monthly = get_monthly(db=db, current_user=current_user)

    # Recent 5 invoices
    recent_invoices = (
        db.query(Invoice)
        .filter(Invoice.user_id == uid)
        .order_by(Invoice.created_at.desc())
        .limit(5)
        .all()
    )

    return {
        "summary": summary,
        "top_clients": top_clients,
        "monthly_revenue": monthly,
        "recent_invoices": [
            {"id": i.id, "invoice_number": i.invoice_number, "amount": float(i.amount), "status": i.status, "due_date": str(i.due_date)}
            for i in recent_invoices
        ],
    }