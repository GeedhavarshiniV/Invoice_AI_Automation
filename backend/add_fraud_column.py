from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text("ALTER TABLE invoices ADD COLUMN IF NOT EXISTS fraud_decision VARCHAR"))
    conn.commit()

print("Done: fraud_decision column added (or already existed).")