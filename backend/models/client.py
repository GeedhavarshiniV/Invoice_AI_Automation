from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base


class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    company = Column(String(255))
    email = Column(String(255), index=True, nullable=False)
    phone = Column(String(50))
    address = Column(Text)
    location = Column(String(255))
    risk_score = Column(Float, default=50.0)
    payment_behavior = Column(String(50), default="Unknown")   # Good / Moderate / Poor / Unknown
    status = Column(String(50), default="Active")              # Active / Inactive / Blocked
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    owner = relationship("User", back_populates="clients")
    invoices = relationship("Invoice", back_populates="client", cascade="all, delete-orphan")