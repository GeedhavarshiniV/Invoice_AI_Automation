import os

files = {}

files['main.py'] = """from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routes import auth, invoices, clients, extensions, reports

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Ledgerly API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(invoices.router)
app.include_router(clients.router)
app.include_router(extensions.router)
app.include_router(reports.router)

@app.get("/")
def root():
    return {"message": "Ledgerly API is running!", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "healthy"}
"""

files['database.py'] = """from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
"""

files['models/user.py'] = """from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
"""

files['models/client.py'] = """from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class Client(Base):
    __tablename__ = "clients"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String)
    company = Column(String)
    location = Column(String)
    risk_score = Column(Float, default=50.0)
    status = Column(String, default="Active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    invoices = relationship("Invoice", back_populates="client")
"""

files['models/invoice.py'] = """from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String, unique=True, index=True, nullable=False)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(Text)
    status = Column(String, default="Pending")
    issued_date = Column(DateTime(timezone=True), server_default=func.now())
    due_date = Column(DateTime(timezone=True), nullable=False)
    paid_date = Column(DateTime(timezone=True), nullable=True)
    fraud_score = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    client = relationship("Client", back_populates="invoices")
    extensions = relationship("Extension", back_populates="invoice")
"""

files['models/extension.py'] = """from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class Extension(Base):
    __tablename__ = "extensions"
    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    original_due_date = Column(DateTime(timezone=True), nullable=False)
    new_due_date = Column(DateTime(timezone=True), nullable=False)
    days_extended = Column(Integer, nullable=False)
    reason = Column(Text)
    risk_score = Column(Float, default=50.0)
    status = Column(String, default="Approved")
    ai_message = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    invoice = relationship("Invoice", back_populates="extensions")
"""

files['models/__init__.py'] = ""
files['routes/__init__.py'] = ""
files['schemas/__init__.py'] = ""
files['services/__init__.py'] = ""

files['schemas/schemas.py'] = """from pydantic import BaseModel, EmailStr
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

class ClientOut(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str]
    company: Optional[str]
    location: Optional[str]
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
"""

files['services/risk_engine.py'] = """from sqlalchemy.orm import Session
from models.invoice import Invoice

def calculate_risk_score(client_id: int, db: Session) -> float:
    invoices = db.query(Invoice).filter(Invoice.client_id == client_id).all()
    if not invoices:
        return 50.0
    total = len(invoices)
    paid = len([i for i in invoices if i.status == "Paid"])
    overdue = len([i for i in invoices if i.status == "Overdue"])
    disputed = len([i for i in invoices if i.status == "Disputed"])
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
        return f"Hi {client_name},\\n\\nWe are happy to extend your payment deadline by {days} days for the amount of Rs.{amount:,.0f}.\\n\\nWarm regards,\\nLedgerly Team"
    elif risk_level == "Medium Risk":
        return f"Hi {client_name},\\n\\nWe can offer a {days}-day extension for Rs.{amount:,.0f}. This is a one-time accommodation.\\n\\nRegards,\\nLedgerly Team"
    return f"Hi {client_name},\\n\\nWe offer a limited {days}-day extension for Rs.{amount:,.0f}. Please treat this as urgent.\\n\\nLedgerly Collections Team"
"""

files['services/notifier.py'] = """import requests
import os
from dotenv import load_dotenv
load_dotenv()

N8N_WEBHOOK_URL = os.getenv("N8N_WEBHOOK_URL", "http://localhost:5678/webhook")

def send_notification(event_type: str, data: dict):
    try:
        response = requests.post(N8N_WEBHOOK_URL, json={"event": event_type, "data": data}, timeout=5)
        return response.status_code == 200
    except Exception as e:
        print(f"Notification failed: {e}")
        return False

def notify_extension_approved(client_name, invoice_number, new_due_date, email):
    send_notification("extension_approved", {"client_name": client_name, "invoice_number": invoice_number, "new_due_date": new_due_date, "email": email})

def notify_overdue(client_name, invoice_number, amount, email):
    send_notification("invoice_overdue", {"client_name": client_name, "invoice_number": invoice_number, "amount": amount, "email": email})
"""

files['routes/auth.py'] = """from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
from database import get_db
from models.user import User
from schemas.schemas import UserCreate, UserLogin, Token
import os
from dotenv import load_dotenv
load_dotenv()

router = APIRouter(prefix="/auth", tags=["Auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

def hash_password(password):
    return pwd_context.hash(password)

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def create_token(data):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@router.post("/register", response_model=Token)
def register(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = User(name=user.name, email=user.email, hashed_password=hash_password(user.password))
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    token = create_token({"sub": user.email})
    return Token(access_token=token, token_type="bearer", user_name=new_user.name, user_email=new_user.email)

@router.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token({"sub": user.email})
    return Token(access_token=token, token_type="bearer", user_name=db_user.name, user_email=db_user.email)
"""

files['routes/invoices.py'] = """from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.invoice import Invoice
from models.client import Client
from schemas.schemas import InvoiceCreate, InvoiceOut, InvoiceStatusUpdate
from typing import List
from datetime import datetime

router = APIRouter(prefix="/invoices", tags=["Invoices"])

def generate_invoice_number(db):
    count = db.query(Invoice).count()
    return f"INV-{1000 + count + 1}"

@router.get("/", response_model=List[InvoiceOut])
def get_invoices(db: Session = Depends(get_db)):
    return db.query(Invoice).order_by(Invoice.created_at.desc()).all()

@router.get("/{invoice_id}", response_model=InvoiceOut)
def get_invoice(invoice_id: int, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice

@router.post("/", response_model=InvoiceOut)
def create_invoice(invoice: InvoiceCreate, db: Session = Depends(get_db)):
    if not db.query(Client).filter(Client.id == invoice.client_id).first():
        raise HTTPException(status_code=404, detail="Client not found")
    new_invoice = Invoice(invoice_number=generate_invoice_number(db), client_id=invoice.client_id, amount=invoice.amount, description=invoice.description, due_date=invoice.due_date, status="Pending")
    db.add(new_invoice)
    db.commit()
    db.refresh(new_invoice)
    return new_invoice

@router.patch("/{invoice_id}/status", response_model=InvoiceOut)
def update_status(invoice_id: int, update: InvoiceStatusUpdate, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    invoice.status = update.status
    if update.status == "Paid":
        invoice.paid_date = datetime.utcnow()
    db.commit()
    db.refresh(invoice)
    return invoice

@router.delete("/{invoice_id}")
def delete_invoice(invoice_id: int, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    db.delete(invoice)
    db.commit()
    return {"message": "Invoice deleted"}
"""

files['routes/clients.py'] = """from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.client import Client
from schemas.schemas import ClientCreate, ClientOut
from services.risk_engine import calculate_risk_score, get_risk_level
from typing import List

router = APIRouter(prefix="/clients", tags=["Clients"])

@router.get("/", response_model=List[ClientOut])
def get_clients(db: Session = Depends(get_db)):
    return db.query(Client).order_by(Client.created_at.desc()).all()

@router.get("/{client_id}", response_model=ClientOut)
def get_client(client_id: int, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client

@router.post("/", response_model=ClientOut)
def create_client(client: ClientCreate, db: Session = Depends(get_db)):
    if db.query(Client).filter(Client.email == client.email).first():
        raise HTTPException(status_code=400, detail="Email already exists")
    new_client = Client(name=client.name, email=client.email, phone=client.phone, company=client.company, location=client.location, risk_score=50.0, status="New")
    db.add(new_client)
    db.commit()
    db.refresh(new_client)
    return new_client

@router.get("/{client_id}/risk")
def get_client_risk(client_id: int, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    score = calculate_risk_score(client_id, db)
    client.risk_score = score
    db.commit()
    return {"client_id": client_id, "risk_score": score, "risk_level": get_risk_level(score)}

@router.delete("/{client_id}")
def delete_client(client_id: int, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    db.delete(client)
    db.commit()
    return {"message": "Client deleted"}
"""

files['routes/extensions.py'] = """from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.extension import Extension
from models.invoice import Invoice
from models.client import Client
from schemas.schemas import ExtensionCreate, ExtensionOut
from services.risk_engine import calculate_risk_score, get_suggested_extension_days, get_risk_level, generate_extension_message
from services.notifier import notify_extension_approved
from datetime import timedelta
from typing import List

router = APIRouter(prefix="/extensions", tags=["Extensions"])

@router.get("/", response_model=List[ExtensionOut])
def get_extensions(db: Session = Depends(get_db)):
    return db.query(Extension).order_by(Extension.created_at.desc()).all()

@router.get("/analyze/{invoice_id}")
def analyze_invoice(invoice_id: int, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    client = db.query(Client).filter(Client.id == invoice.client_id).first()
    risk_score = calculate_risk_score(invoice.client_id, db)
    suggestion = get_suggested_extension_days(risk_score)
    return {"invoice_id": invoice_id, "invoice_number": invoice.invoice_number, "client_name": client.name, "amount": invoice.amount, "due_date": invoice.due_date, "risk_score": risk_score, "risk_level": get_risk_level(risk_score), "suggested_days": suggestion["days"], "suggestion_reason": suggestion["reason"]}

@router.post("/", response_model=ExtensionOut)
def create_extension(ext: ExtensionCreate, db: Session = Depends(get_db)):
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
"""

files['routes/reports.py'] = """from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models.invoice import Invoice
from models.client import Client

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/summary")
def get_summary(db: Session = Depends(get_db)):
    total = db.query(func.sum(Invoice.amount)).scalar() or 0
    paid = db.query(func.sum(Invoice.amount)).filter(Invoice.status == "Paid").scalar() or 0
    pending = db.query(func.sum(Invoice.amount)).filter(Invoice.status == "Pending").scalar() or 0
    overdue = db.query(func.sum(Invoice.amount)).filter(Invoice.status == "Overdue").scalar() or 0
    return {"total_billed": total, "total_collected": paid, "total_pending": pending, "total_overdue": overdue, "collection_rate": round((paid / total * 100), 1) if total > 0 else 0, "total_invoices": db.query(Invoice).count(), "paid_invoices": db.query(Invoice).filter(Invoice.status == "Paid").count(), "pending_invoices": db.query(Invoice).filter(Invoice.status == "Pending").count(), "overdue_invoices": db.query(Invoice).filter(Invoice.status == "Overdue").count(), "total_clients": db.query(Client).count()}

@router.get("/top-clients")
def get_top_clients(db: Session = Depends(get_db)):
    results = db.query(Client.id, Client.name, Client.email, func.sum(Invoice.amount).label("total_billed"), func.count(Invoice.id).label("total_invoices")).join(Invoice).group_by(Client.id).order_by(func.sum(Invoice.amount).desc()).limit(5).all()
    return [{"id": r.id, "name": r.name, "email": r.email, "total_billed": r.total_billed, "total_invoices": r.total_invoices} for r in results]

@router.get("/monthly")
def get_monthly(db: Session = Depends(get_db)):
    results = db.query(func.date_trunc("month", Invoice.issued_date).label("month"), func.sum(Invoice.amount).label("revenue"), func.count(Invoice.id).label("invoices")).group_by("month").order_by("month").all()
    return [{"month": str(r.month)[:7], "revenue": r.revenue or 0, "invoices": r.invoices} for r in results]
"""

# Write all files
for filepath, content in files.items():
    os.makedirs(os.path.dirname(filepath) if os.path.dirname(filepath) else '.', exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✅ {filepath}")

print("\nAll files written successfully!")