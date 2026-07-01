from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base


class AILog(Base):
    __tablename__ = "ai_logs"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    # What the AI did: fraud_detection | risk_prediction | extension_message | invoice_analysis
    ai_action = Column(String(100), nullable=False)
    input_data = Column(Text)        # JSON string of what was sent to AI
    ai_response = Column(Text)       # full AI response
    confidence_score = Column(Float, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    invoice = relationship("Invoice", back_populates="ai_logs")
    user = relationship("User", back_populates="ai_logs")