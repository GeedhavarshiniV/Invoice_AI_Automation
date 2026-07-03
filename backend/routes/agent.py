from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from pydantic import BaseModel
from datetime import timedelta

from database import get_db
from models.invoice import Invoice
from models.client import Client
from models.extension import Extension
from models.reminder import Reminder
from models.agent_log import AgentLog
from models.user import User
from auth_dependency import get_current_user
from services.risk_engine import calculate_risk_score, get_suggested_extension_days, get_risk_level, generate_extension_message
from services.notifier import notify_extension_approved, send_notification

router = APIRouter(prefix="/agent", tags=["AI Agent"])


def _fmt_amt(n):
    return f"₹{round(n or 0):,}"


def _log(db, user_message, action_type, response_summary, status="Resolved", target_client=None, target_invoice=None):
    entry = AgentLog(
        user_message=user_message,
        action_type=action_type,
        target_client=target_client,
        target_invoice=target_invoice,
        response_summary=response_summary,
        status=status,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def _handle_overdue(db: Session, text: str):
    invoices = db.query(Invoice).filter(Invoice.status == "Overdue").all()
    if not invoices:
        return "No overdue invoices right now — everything's on track.", "Resolved"
    lines = []
    for inv in invoices:
        client = db.query(Client).filter(Client.id == inv.client_id).first()
        days = max(1, (func.now()))  # placeholder, real calc below
        lines.append(f"• **{inv.invoice_number}** — {client.name if client else 'Unknown'} — {_fmt_amt(inv.total_amount or inv.amount)}")
    body = "\n".join(lines)
    return f"📋 Found **{len(invoices)} overdue invoice(s)**:\n\n{body}", "Resolved"


def _handle_disputed(db: Session, text: str):
    invoices = db.query(Invoice).filter(Invoice.status == "Disputed").all()
    if not invoices:
        return "No disputed invoices at the moment.", "Resolved"
    lines = []
    for inv in invoices:
        client = db.query(Client).filter(Client.id == inv.client_id).first()
        lines.append(f"• **{inv.invoice_number}** — {client.name if client else 'Unknown'} — {_fmt_amt(inv.total_amount or inv.amount)}")
    body = "\n".join(lines)
    return f"🔍 **{len(invoices)} disputed invoice(s)** under review:\n\n{body}", "Escalated"


def _handle_send_reminders(db: Session, text: str):
    invoices = db.query(Invoice).filter(Invoice.status == "Pending").all()
    if not invoices:
        return "No pending invoices need reminders right now.", "Resolved"
    sent_lines = []
    for inv in invoices:
        client = db.query(Client).filter(Client.id == inv.client_id).first()
        if not client:
            continue
        existing_count = db.query(Reminder).filter(Reminder.invoice_id == inv.id).count()
        tone = "Friendly" if existing_count == 0 else ("Firm" if existing_count == 1 else "Urgent")
        amt = _fmt_amt(inv.total_amount or inv.amount)
        message = f"Hi {client.name.split(' ')[0]}, this is a {tone.lower()} reminder that invoice {inv.invoice_number} for {amt} is pending payment."
        reminder = Reminder(invoice_id=inv.id, tone=tone, message=message)
        db.add(reminder)
        db.commit()
        send_notification("deadline_reminder", {
            "client_name": client.name,
            "invoice_number": inv.invoice_number,
            "tone": tone,
            "message": message,
            "email": client.email,
        })
        sent_lines.append(f"• {client.name} ({inv.invoice_number}) — {tone} reminder")
    if not sent_lines:
        return "No reminders were sent — no valid pending invoices found.", "Unhandled"
    body = "\n".join(sent_lines)
    return f"✅ Sent reminders to **{len(sent_lines)} client(s)**:\n\n{body}", "Sent"


def _handle_approve_extension(db: Session, text: str):
    # Expects phrasing like "approve extension for <name>"
    lowered = text.lower()
    marker = "for"
    idx = lowered.rfind(marker)
    name_part = text[idx + len(marker):].strip() if idx != -1 else ""
    if not name_part:
        return "Please specify a client name, e.g. \"Approve extension for Priya Nair\".", "Unhandled", None

    client = db.query(Client).filter(Client.name.ilike(f"%{name_part}%")).first()
    if not client:
        return f"I couldn't find a client matching \"{name_part}\".", "Unhandled", None

    invoice = (
        db.query(Invoice)
        .filter(Invoice.client_id == client.id, Invoice.status.in_(["Pending", "Overdue"]))
        .order_by(Invoice.due_date.asc())
        .first()
    )
    if not invoice:
        return f"{client.name} has no pending or overdue invoices to extend.", "Unhandled", client.name

    risk_score = calculate_risk_score(client.id, db)
    risk_level = get_risk_level(risk_score)
    suggestion = get_suggested_extension_days(risk_score)
    days = suggestion["days"]
    new_due_date = invoice.due_date + timedelta(days=days)
    ai_message = generate_extension_message(client.name, days, risk_level, invoice.amount)

    extension = Extension(
        invoice_id=invoice.id,
        original_due_date=invoice.due_date,
        new_due_date=new_due_date,
        days_extended=days,
        reason="Approved via AI Agent",
        risk_score=risk_score,
        status="Approved",
        ai_message=ai_message,
    )
    invoice.due_date = new_due_date
    db.add(extension)
    db.commit()

    notify_extension_approved(client.name, invoice.invoice_number, str(new_due_date), client.email)

    reply = (
        f"✅ **Extension approved** for {client.name}!\n\n"
        f"• Invoice: {invoice.invoice_number}\n"
        f"• Amount: {_fmt_amt(invoice.amount)}\n"
        f"• New due date: **{new_due_date.strftime('%B %d, %Y')}** (+{days} days)\n"
        f"• Reason: {suggestion['reason']}\n\n"
        f"Client has been notified."
    )
    return reply, "Approved", client.name


def _handle_summary(db: Session, text: str):
    total = db.query(func.sum(Invoice.amount)).scalar() or 0
    paid = db.query(func.sum(Invoice.amount)).filter(Invoice.status == "Paid").scalar() or 0
    pending = db.query(func.sum(Invoice.amount)).filter(Invoice.status == "Pending").scalar() or 0
    overdue = db.query(func.sum(Invoice.amount)).filter(Invoice.status == "Overdue").scalar() or 0
    rate = round((paid / total * 100), 1) if total > 0 else 0

    reply = (
        f"📊 **Payment Summary**\n\n"
        f"• Total billed: {_fmt_amt(total)}\n"
        f"• Collected: {_fmt_amt(paid)} ({rate}%)\n"
        f"• Pending: {_fmt_amt(pending)}\n"
        f"• Overdue: {_fmt_amt(overdue)}"
    )
    return reply, "Resolved"


class AgentMessageRequest(BaseModel):
    message: str


@router.post("/message")
def send_message(
    payload: AgentMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    text = payload.message.strip()
    lowered = text.lower()

    if "overdue" in lowered:
        reply, status = _handle_overdue(db, text)
        _log(db, text, "overdue", reply, status)
        return {"reply": reply, "status": status}

    if "dispute" in lowered:
        reply, status = _handle_disputed(db, text)
        _log(db, text, "disputes", reply, status)
        return {"reply": reply, "status": status}

    if "reminder" in lowered:
        reply, status = _handle_send_reminders(db, text)
        _log(db, text, "reminders", reply, status)
        return {"reply": reply, "status": status}

    if "extension" in lowered or "approve" in lowered:
        reply, status, client_name = _handle_approve_extension(db, text)
        _log(db, text, "extension", reply, status, target_client=client_name)
        return {"reply": reply, "status": status}

    if "summary" in lowered or "payment summary" in lowered:
        reply, status = _handle_summary(db, text)
        _log(db, text, "summary", reply, status)
        return {"reply": reply, "status": status}

    reply = (
        f"I'm not sure how to help with \"{text}\" yet. "
        f"Try asking about overdue invoices, disputes, reminders, an extension approval, or a payment summary."
    )
    _log(db, text, "unhandled", reply, "Unhandled")
    return {"reply": reply, "status": "Unhandled"}


@router.get("/logs")
def get_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logs = db.query(AgentLog).order_by(AgentLog.created_at.desc()).limit(50).all()
    return [
        {
            "id": log.id,
            "message": log.user_message,
            "action_type": log.action_type,
            "client": log.target_client,
            "invoice": log.target_invoice,
            "response": log.response_summary,
            "status": log.status,
            "time": log.created_at.isoformat() if log.created_at else None,
        }
        for log in logs
    ]


@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today_count = db.query(AgentLog).filter(func.date(AgentLog.created_at) == func.current_date()).count()
    resolved_count = db.query(AgentLog).filter(
        func.date(AgentLog.created_at) == func.current_date(),
        AgentLog.status.in_(["Resolved", "Approved", "Sent"]),
    ).count()
    escalated_count = db.query(AgentLog).filter(
        func.date(AgentLog.created_at) == func.current_date(),
        AgentLog.status == "Escalated",
    ).count()
    total_logs = db.query(AgentLog).count()

    return {
        "handled_today": today_count,
        "auto_resolved": resolved_count,
        "escalated": escalated_count,
        "total_logged": total_logs,
    }