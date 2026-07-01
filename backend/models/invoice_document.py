from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, BigInteger
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base


class InvoiceDocument(Base):
    __tablename__ = "invoice_documents"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, index=True)

    file_name = Column(String(255), nullable=False)
    file_type = Column(String(50))            # application/pdf, image/png, etc.
    file_size = Column(BigInteger)            # bytes
    storage_path = Column(String(512), nullable=False)  # local path or S3 key

    # Version support: version 1, 2, 3 … for same invoice
    version = Column(Integer, default=1)

    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    invoice = relationship("Invoice", back_populates="documents")
    uploader = relationship("User", foreign_keys=[uploaded_by])