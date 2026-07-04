from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_name: str
    user_email: str

class ClientCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    state: Optional[str] = None  # NEW

class ClientOut(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str]
    company: Optional[str]
    location: Optional[str]
    state: Optional[str]  # NEW
    risk_score: float
    status: str
    created_at: datetime
    class Config:
        from_attributes = True

class InvoiceCreate(BaseModel):
    client_id: int
    amount: float
    description: Optional[str] = None
    due_date: datetime
    category: Optional[str] = "default"  # NEW: looks up GST_RATES, defaults if omitted

class InvoiceOut(BaseModel):
    id: int
    invoice_number: str
    client_id: int
    amount: float
    description: Optional[str]
    status: str
    issued_date: datetime
    due_date: datetime
    paid_date: Optional[datetime]
    fraud_score: float
    # --- NEW: GST fields ---
    category: Optional[str]
    tax_type: Optional[str]
    cgst: float
    sgst: float
    igst: float
    total_gst: float
    total_amount: float
    class Config:
        from_attributes = True

class InvoiceStatusUpdate(BaseModel):
    status: str

class ExtensionCreate(BaseModel):
    invoice_id: int
    days_extended: int
    reason: Optional[str] = None

class ExtensionOut(BaseModel):
    id: int
    invoice_id: int
    original_due_date: datetime
    new_due_date: datetime
    days_extended: int
    risk_score: float
    status: str
    ai_message: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True

# NEW — public, no-auth response shape for the shareable tracker link
class InvoiceTrackOut(BaseModel):
    invoice_number: str
    amount: float
    total_amount: float
    status: str
    issued_date: datetime
    due_date: datetime
    paid_date: Optional[datetime]
    description: Optional[str]
    category: Optional[str]
    tax_type: Optional[str]
    cgst: float
    sgst: float
    igst: float
    total_gst: float
    client_name: str
    client_email: str
    class Config:
        from_attributes = True