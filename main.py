"""
InvoiceAI — Agent Server
------------------------
Run with:  uvicorn main:app --reload --port 8000
Docs at:   http://localhost:8000/docs
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.agents import router

app = FastAPI(
    title="InvoiceAI Agent Server",
    description="Three AI agents: OCR extraction, validation, and chatbot — powered by Gemini.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Allow your React frontend (or any local origin) to call these APIs
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tighten this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

@app.get("/")
def root():
    return {
        "message": "InvoiceAI Agent Server is running",
        "docs": "http://localhost:8000/docs",
        "endpoints": {
            "extract": "POST /api/extract",
            "validate": "POST /api/validate",
            "validate_ai": "POST /api/validate/ai",
            "validate_full": "POST /api/validate/full",
            "chat": "POST /api/chat",
            "health": "GET /api/health",
        },
    }
