from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base


class Extension(Base):
    __tablename__ = "extensions"

    id = Column(Integer, primary_key=True, index=True)

    invoice_id = Column(
        Integer,
        ForeignKey("invoices.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Database columns
    original_due_date = Column(
        DateTime(timezone=True),
        nullable=False
    )

    new_due_date = Column(
        DateTime(timezone=True),
        nullable=False
    )

    days_extended = Column(
        Integer,
        nullable=False
    )

    reason = Column(Text)

    risk_score = Column(
        Float,
        default=50.0
    )

    status = Column(
        String(50),
        default="Approved"
    )

    ai_generated_message = Column(Text)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )


    # Extra fields already present in DB
    requested_days = Column(Integer)

    old_due_date = Column(
        DateTime(timezone=True)
    )

    approved_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )


    # Relationships
    invoice = relationship(
        "Invoice",
        back_populates="extensions"
    )

    approver = relationship(
        "User",
        foreign_keys=[approved_by]
    )