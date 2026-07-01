from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Numeric
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, index=True)

    amount_paid = Column(Numeric(12, 2), nullable=False)
    payment_method = Column(String(100))          # UPI / Bank Transfer / Card / Cash / etc.
    transaction_id = Column(String(255), unique=True, nullable=True)
    payment_date = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(50), default="Success")   # Success | Failed | Pending / Refunded

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    invoice = relationship("Invoice", back_populates="payments")