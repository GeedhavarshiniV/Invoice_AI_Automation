from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Numeric
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)

    amount = Column(Numeric(12, 2), nullable=False)
    tax = Column(Numeric(12, 2), default=0.0)
    description = Column(Text)

    # Status: Draft | Sent | Pending | Paid | Overdue | Cancelled
    status = Column(String(50), default="Pending", index=True)

    issue_date = Column(DateTime(timezone=True), server_default=func.now())
    due_date = Column(DateTime(timezone=True), nullable=False, index=True)
    paid_date = Column(DateTime(timezone=True), nullable=True)

    fraud_score = Column(Float, default=0.0)
    ai_analysis = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    owner = relationship("User", back_populates="invoices")
    client = relationship("Client", back_populates="invoices")
    extensions = relationship("Extension", back_populates="invoice", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan")
    documents = relationship("InvoiceDocument", back_populates="invoice", cascade="all, delete-orphan")
    ai_logs = relationship("AILog", back_populates="invoice", cascade="all, delete-orphan")