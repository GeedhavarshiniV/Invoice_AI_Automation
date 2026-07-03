from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base


class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String, unique=True, index=True, nullable=False)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    amount = Column(Float, nullable=False)  # amount before tax
    description = Column(Text)
    status = Column(String, default="Pending")
    issued_date = Column(DateTime(timezone=True), server_default=func.now())
    due_date = Column(DateTime(timezone=True), nullable=False)
    paid_date = Column(DateTime(timezone=True), nullable=True)
    fraud_score = Column(Float, default=0.0)
    fraud_decision = Column(String, nullable=True)  # "clear" | "fraud" | None
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # --- NEW: GST fields ---
    category = Column(String, default="default")      # used to look up GST_RATES
    tax_type = Column(String, nullable=True)           # "CGST_SGST" or "IGST"
    cgst = Column(Float, default=0.0)
    sgst = Column(Float, default=0.0)
    igst = Column(Float, default=0.0)
    total_gst = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)          # amount + total_gst

    client = relationship("Client", back_populates="invoices")
    extensions = relationship("Extension", back_populates="invoice")
    reminders = relationship("Reminder", back_populates="invoice")