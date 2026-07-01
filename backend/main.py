from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base

# Import all models so SQLAlchemy registers every table
import models  # noqa: F401 — triggers __init__.py which imports all models

from routes import auth, invoices, clients, extensions, reports, payments, documents, notifications

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Ledgerly API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ───────────────────────────────────────────
app.include_router(auth.router)
app.include_router(clients.router)
app.include_router(invoices.router)
app.include_router(documents.router)    # NEW — /invoices/{id}/upload, /download, /documents
app.include_router(payments.router)     # NEW — /payments
app.include_router(extensions.router)
app.include_router(reports.router)
app.include_router(notifications.router)  # NEW — /notifications


@app.get("/")
def root():
    return {"message": "Ledgerly API is running!", "version": "2.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}