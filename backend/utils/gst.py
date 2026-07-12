"""
GST (Goods and Services Tax) calculation utility for Indian tax compliance.

Centralizes all GST business logic so it is never duplicated across routes.
Designed to be extended later with: multiple slabs, exemptions, HSN/SAC
mapping, Reverse Charge Mechanism, Union Territory GST, export invoices,
and GSTIN validation — without touching calculate_gst()'s call sites.
"""

from typing import Optional, TypedDict
from fastapi import HTTPException

# ---------------------------------------------------------------------------
# 1. Seller configuration — single source of truth.
#    Change this one value to relocate the business; nothing else needs editing.
# ---------------------------------------------------------------------------
SELLER_STATE = "Tamil Nadu"

# ---------------------------------------------------------------------------
# 2. GST rate configuration — keyed by product/service category.
#    Add new categories here without touching calculate_gst().
# ---------------------------------------------------------------------------
GST_RATES = {
    "default": 18,
    "electronics": 18,
    "software": 18,
    "consulting": 18,
}


class GSTResult(TypedDict):
    tax_type: str
    gst_percent: float
    cgst_percent: float
    sgst_percent: float
    igst_percent: float
    cgst_amount: float
    sgst_amount: float
    igst_amount: float
    total_gst: float
    total_amount: float


def _normalize_state(state: str) -> str:
    """Lowercase + strip so 'Tamil Nadu' == 'tamil nadu ' == ' TAMIL NADU'."""
    return state.strip().lower()


def calculate_gst(
    amount: float,
    seller_state: str,
    client_state: Optional[str],
    category: str = "default",
) -> GSTResult:
    """
    Calculate Indian GST for a transaction.

    Rules:
    - Same state (seller == client) -> CGST + SGST, split evenly.
    - Different state               -> IGST, full rate.

    Raises HTTPException(400) if amount is invalid or client_state is missing,
    so routes can simply call this and let FastAPI handle the error response.
    """
    if amount is None or amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")

    if not client_state or not client_state.strip():
        raise HTTPException(
            status_code=400,
            detail="Client state is required to calculate GST. Please set the client's state.",
        )

    gst_rate = GST_RATES.get(category, GST_RATES["default"])

    same_state = _normalize_state(seller_state) == _normalize_state(client_state)

    if same_state:
        cgst_percent = gst_rate / 2
        sgst_percent = gst_rate / 2
        cgst_amount = round(amount * cgst_percent / 100, 2)
        sgst_amount = round(amount * sgst_percent / 100, 2)
        total_gst = round(cgst_amount + sgst_amount, 2)

        return {
            "tax_type": "CGST_SGST",
            "gst_percent": gst_rate,
            "cgst_percent": cgst_percent,
            "sgst_percent": sgst_percent,
            "igst_percent": 0,
            "cgst_amount": cgst_amount,
            "sgst_amount": sgst_amount,
            "igst_amount": 0.0,
            "total_gst": total_gst,
            "total_amount": round(amount + total_gst, 2),
        }
    else:
        igst_amount = round(amount * gst_rate / 100, 2)

        return {
            "tax_type": "IGST",
            "gst_percent": gst_rate,
            "cgst_percent": 0,
            "sgst_percent": 0,
            "igst_percent": gst_rate,
            "cgst_amount": 0.0,
            "sgst_amount": 0.0,
            "igst_amount": igst_amount,
            "total_gst": igst_amount,
            "total_amount": round(amount + igst_amount, 2),
        }