from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    action = Column(String(100), nullable=False)       # created | updated | deleted | downloaded
    table_name = Column(String(100), nullable=False)   # invoices | clients | payments ...
    record_id = Column(Integer, nullable=True)

    old_value = Column(Text, nullable=True)   # JSON string of old data
    new_value = Column(Text, nullable=True)   # JSON string of new data

    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationship
    user = relationship("User", back_populates="audit_logs")