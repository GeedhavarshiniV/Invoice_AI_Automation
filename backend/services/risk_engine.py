from sqlalchemy.orm import Session
from models.invoice import Invoice


def calculate_risk_score(client_id: int, db: Session) -> float:
    invoices = db.query(Invoice).filter(Invoice.client_id == client_id).all()

    # Only count invoices with a *resolved* outcome - Pending invoices
    # haven't happened yet and shouldn't count against (or for) the client.
    resolved = [i for i in invoices if i.status in ("Paid", "Overdue", "Disputed")]

    if not resolved:
        return 50.0  # neutral score - no track record yet

    total = len(resolved)
    paid = len([i for i in resolved if i.status == "Paid"])
    overdue = len([i for i in resolved if i.status == "Overdue"])
    disputed = len([i for i in resolved if i.status == "Disputed"])

    on_time_rate = paid / total
    overdue_rate = overdue / total
    dispute_rate = disputed / total

    score = (on_time_rate * 70 - overdue_rate * 40 - dispute_rate * 30) * 100
    return round(max(0, min(100, score)), 1)


def get_suggested_extension_days(risk_score: float) -> dict:
    if risk_score >= 70:
        return {"days": 7, "reason": "Strong payment history — 7 days is safe."}
    elif risk_score >= 45:
        return {"days": 5, "reason": "Moderate history — limit to 5 days."}
    else:
        return {"days": 3, "reason": "High risk client — maximum 3 days recommended."}


def get_risk_level(score: float) -> str:
    if score >= 70:
        return "Low Risk"
    elif score >= 45:
        return "Medium Risk"
    return "High Risk"


def generate_extension_message(client_name: str, days: int, risk_level: str, amount: float) -> str:
    if risk_level == "Low Risk":
        return f"Hi {client_name},\n\nWe are happy to extend your payment deadline by {days} days for the amount of Rs.{amount:,.0f}.\n\nWarm regards,\nLedgerly Team"
    elif risk_level == "Medium Risk":
        return f"Hi {client_name},\n\nWe can offer a {days}-day extension for Rs.{amount:,.0f}. This is a one-time accommodation.\n\nRegards,\nLedgerly Team"
    return f"Hi {client_name},\n\nWe offer a limited {days}-day extension for Rs.{amount:,.0f}. Please treat this as urgent.\n\nLedgerly Collections Team"