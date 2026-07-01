from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


# ─────────────────────────────────────────────
# AUTH
# ─────────────────────────────────────────────

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Optional[str] = "business_owner"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user_name: str
    user_email: str
    user_role: str


# ─────────────────────────────────────────────
# CLIENTS
# ─────────────────────────────────────────────

class ClientCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    company: Optional[str] = None
    address: Optional[str] = None
    location: Optional[str] = None


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    address: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None


class ClientOut(BaseModel):
    id: int
    user_id: int
    name: str
    email: str
    phone: Optional[str] = None
    company: Optional[str] = None
    address: Optional[str] = None
    location: Optional[str] = None
    risk_score: Optional[float] = 0
    payment_behavior: Optional[str] = "Unknown"
    status: Optional[str] = "Active"
    created_at: datetime

    class Config:
        from_attributes = True

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# INVOICES
# ─────────────────────────────────────────────

class InvoiceCreate(BaseModel):
    client_id: int
    amount: Decimal
    tax: Optional[Decimal] = Decimal("0.0")
    description: Optional[str] = None
    due_date: datetime
    status: Optional[str] = "Pending"


class InvoiceUpdate(BaseModel):
    amount: Optional[Decimal] = None
    tax: Optional[Decimal] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None


class InvoiceStatusUpdate(BaseModel):
    status: str   # Draft | Sent | Pending | Paid | Overdue | Cancelled


class InvoiceOut(BaseModel):
    id: int
    invoice_number: str
    user_id: int
    client_id: int
    amount: Decimal
    tax: Decimal
    description: Optional[str] = None
    status: str
    issue_date: datetime
    due_date: datetime
    paid_date: Optional[datetime] = None
    fraud_score: float
    ai_analysis: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# PAYMENTS
# ─────────────────────────────────────────────

class PaymentCreate(BaseModel):
    invoice_id: int
    amount_paid: Decimal
    payment_method: Optional[str] = None
    transaction_id: Optional[str] = None


class PaymentOut(BaseModel):
    id: int
    invoice_id: int
    amount_paid: Decimal
    payment_method: Optional[str] = None
    transaction_id: Optional[str] = None
    payment_date: datetime
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# EXTENSIONS
# ─────────────────────────────────────────────

class ExtensionCreate(BaseModel):
    invoice_id: int
    requested_days: int
    reason: Optional[str] = None


class ExtensionOut(BaseModel):
    id: int
    invoice_id: int
    requested_days: int
    old_due_date: datetime
    new_due_date: datetime
    risk_score: float
    status: str
    ai_generated_message: Optional[str] = None
    reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# INVOICE DOCUMENTS
# ─────────────────────────────────────────────

class InvoiceDocumentOut(BaseModel):
    id: int
    invoice_id: int
    file_name: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    storage_path: str
    version: int
    uploaded_by: Optional[int] = None
    uploaded_at: datetime

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# AI LOGS
# ─────────────────────────────────────────────

class AILogOut(BaseModel):
    id: int
    invoice_id: Optional[int] = None
    user_id: Optional[int] = None
    ai_action: str
    input_data: Optional[str] = None
    ai_response: Optional[str] = None
    confidence_score: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# NOTIFICATIONS
# ─────────────────────────────────────────────

class NotificationOut(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    notification_type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# AUDIT LOGS
# ─────────────────────────────────────────────

class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    table_name: str
    record_id: Optional[int] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True