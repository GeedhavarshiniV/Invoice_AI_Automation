from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from database import Base


class AgentLog(Base):
    __tablename__ = "agent_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_message = Column(Text, nullable=False)
    action_type = Column(String, nullable=False)   # "overdue" | "reminders" | "disputes" | "extension" | "summary" | "unhandled"
    target_client = Column(String, nullable=True)
    target_invoice = Column(String, nullable=True)
    response_summary = Column(Text)
    status = Column(String, default="Resolved")     # "Resolved" | "Sent" | "Approved" | "Escalated" | "Unhandled"
    created_at = Column(DateTime(timezone=True), server_default=func.now())