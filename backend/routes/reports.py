from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models.invoice import Invoice
from models.client import Client
from models.user import User
from auth_dependency import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/summary")
def get_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total = db.query(func.sum(Invoice.amount)).scalar() or 0
    paid = db.query(func.sum(Invoice.amount)).filter(Invoice.status == "Paid").scalar() or 0
    pending = db.query(func.sum(Invoice.amount)).filter(Invoice.status == "Pending").scalar() or 0
    overdue = db.query(func.sum(Invoice.amount)).filter(Invoice.status == "Overdue").scalar() or 0
    return {"total_billed": total, "total_collected": paid, "total_pending": pending, "total_overdue": overdue, "collection_rate": round((paid / total * 100), 1) if total > 0 else 0, "total_invoices": db.query(Invoice).count(), "paid_invoices": db.query(Invoice).filter(Invoice.status == "Paid").count(), "pending_invoices": db.query(Invoice).filter(Invoice.status == "Pending").count(), "overdue_invoices": db.query(Invoice).filter(Invoice.status == "Overdue").count(), "total_clients": db.query(Client).count()}


@router.get("/top-clients")
def get_top_clients(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    results = db.query(Client.id, Client.name, Client.email, func.sum(Invoice.amount).label("total_billed"), func.count(Invoice.id).label("total_invoices")).join(Invoice).group_by(Client.id).order_by(func.sum(Invoice.amount).desc()).limit(5).all()
    return [{"id": r.id, "name": r.name, "email": r.email, "total_billed": r.total_billed, "total_invoices": r.total_invoices} for r in results]


@router.get("/monthly")
def get_monthly(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    results = db.query(func.date_trunc("month", Invoice.issued_date).label("month"), func.sum(Invoice.amount).label("revenue"), func.count(Invoice.id).label("invoices")).group_by("month").order_by("month").all()
    return [{"month": str(r.month)[:7], "revenue": r.revenue or 0, "invoices": r.invoices} for r in results]