from sqlalchemy.orm import Session
from models.invoice import Invoice
from datetime import timedelta

# Thresholds — tunable constants, not magic numbers scattered in logic
AMOUNT_ANOMALY_MULTIPLIER = 2.0      # flag if invoice is >2x that client's own average
NEW_CLIENT_HIGH_VALUE_THRESHOLD = 50000  # flag first-ever invoice above this amount
RAPID_INVOICE_WINDOW_HOURS = 48      # flag invoices to same client within this window
ROUND_NUMBER_DIVISOR = 1000          # flag amounts that are perfectly divisible by this

WEIGHT_SCORES = {"high": 35, "medium": 20, "low": 10}


def _get_client_invoices(db: Session, client_id: int, exclude_id: int = None):
    q = db.query(Invoice).filter(Invoice.client_id == client_id)
    if exclude_id is not None:
        q = q.filter(Invoice.id != exclude_id)
    return q.all()


def analyze_invoice(invoice: Invoice, db: Session) -> dict:
    """
    Computes real fraud signals for a single invoice based only on
    data that actually exists in the schema. Returns a score (0-100)
    and a list of specific signals that were triggered.
    """
    signals = []
    other_invoices = _get_client_invoices(db, invoice.client_id, exclude_id=invoice.id)
    is_new_client = len(other_invoices) == 0

    # --- Signal 1: Amount anomaly vs. this client's own history ---
    if other_invoices:
        past_amounts = [i.total_amount or i.amount for i in other_invoices]
        avg_amount = sum(past_amounts) / len(past_amounts)
        current_amount = invoice.total_amount or invoice.amount
        if avg_amount > 0 and current_amount > avg_amount * AMOUNT_ANOMALY_MULTIPLIER:
            signals.append({
                "type": "Amount Anomaly",
                "weight": "high",
                "detail": f"This invoice (₹{current_amount:,.0f}) is over {AMOUNT_ANOMALY_MULTIPLIER}x this client's average of ₹{avg_amount:,.0f}."
            })

    # --- Signal 2: New client + high value ---
    if is_new_client:
        current_amount = invoice.total_amount or invoice.amount
        if current_amount >= NEW_CLIENT_HIGH_VALUE_THRESHOLD:
            signals.append({
                "type": "New Client, High Value",
                "weight": "high",
                "detail": f"This is the client's first invoice on record, billed at ₹{current_amount:,.0f}."
            })

    # --- Signal 3: Dispute history ---
    if other_invoices:
        resolved = [i for i in other_invoices if i.status in ("Paid", "Overdue", "Disputed")]
        if resolved:
            dispute_rate = len([i for i in resolved if i.status == "Disputed"]) / len(resolved)
            if dispute_rate > 0:
                signals.append({
                    "type": "Dispute History",
                    "weight": "medium",
                    "detail": f"{round(dispute_rate * 100)}% of this client's past invoices were disputed."
                })

    # --- Signal 4: Rapid invoicing (possible duplicate/split billing) ---
    if invoice.issued_date:
        window_start = invoice.issued_date - timedelta(hours=RAPID_INVOICE_WINDOW_HOURS)
        window_end = invoice.issued_date + timedelta(hours=RAPID_INVOICE_WINDOW_HOURS)
        nearby = [
            i for i in other_invoices
            if i.issued_date and window_start <= i.issued_date <= window_end
        ]
        if nearby:
            signals.append({
                "type": "Rapid Invoicing",
                "weight": "medium",
                "detail": f"{len(nearby)} other invoice(s) issued to this client within {RAPID_INVOICE_WINDOW_HOURS} hours."
            })

    # --- Signal 5: Round number amount (weak heuristic) ---
    current_amount = invoice.total_amount or invoice.amount
    if current_amount > 0 and current_amount % ROUND_NUMBER_DIVISOR == 0:
        signals.append({
            "type": "Round Number Amount",
            "weight": "low",
            "detail": f"Amount is an exact multiple of ₹{ROUND_NUMBER_DIVISOR:,} — common in fabricated invoices."
        })

    score = sum(WEIGHT_SCORES[s["weight"]] for s in signals)
    score = min(100, score)

    return {
        "score": round(score, 1),
        "signals": signals,
        "is_new_client": is_new_client,
    }


def get_flagged_invoices(db: Session, min_score: float = 35.0):
    """
    Runs analysis over all invoices and returns those meeting the
    minimum score threshold, along with their computed signals.
    """
    all_invoices = db.query(Invoice).order_by(Invoice.created_at.desc()).all()
    flagged = []
    for inv in all_invoices:
        result = analyze_invoice(inv, db)
        if result["score"] >= min_score:
            flagged.append((inv, result))
    return flagged