from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routes import auth, invoices, clients, extensions, reports

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Ledgerly API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(invoices.router)
app.include_router(clients.router)
app.include_router(extensions.router)
app.include_router(reports.router)

@app.get("/")
def root():
    return {"message": "Ledgerly API is running!", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "healthy"}
