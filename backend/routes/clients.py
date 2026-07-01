from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.client import Client
from models.user import User
from models.audit_log import AuditLog
from schemas.schemas import ClientCreate, ClientOut, ClientUpdate
from services.risk_engine import calculate_risk_score, get_risk_level
from auth_dependency import get_current_user
from typing import List
import json

router = APIRouter(prefix="/clients", tags=["Clients"])


def _log_audit(db, user_id, action, record_id, old=None, new=None):
    db.add(AuditLog(
        user_id=user_id,
        action=action,
        table_name="clients",
        record_id=record_id,
        old_value=json.dumps(old) if old else None,
        new_value=json.dumps(new) if new else None,
    ))


@router.get("/", response_model=List[ClientOut])
def get_clients(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Users see only their own clients
    return db.query(Client).filter(Client.user_id == current_user.id).order_by(Client.created_at.desc()).all()


@router.get("/{client_id}", response_model=ClientOut)
def get_client(client_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    client = db.query(Client).filter(Client.id == client_id, Client.user_id == current_user.id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


@router.post("/", response_model=ClientOut)
def create_client(client: ClientCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Email must be unique per user (same client email, different users = OK)
    existing = db.query(Client).filter(Client.email == client.email, Client.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Client with this email already exists")

    new_client = Client(
        user_id=current_user.id,
        name=client.name,
        email=client.email,
        phone=client.phone,
        company=client.company,
        address=client.address,
        location=client.location,
        risk_score=50.0,
        payment_behavior="Unknown",
        status="Active",
    )
    db.add(new_client)
    db.commit()
    db.refresh(new_client)

    _log_audit(db, current_user.id, "created", new_client.id, new={"name": new_client.name, "email": new_client.email})
    db.commit()

    return new_client


@router.put("/{client_id}", response_model=ClientOut)
def update_client(client_id: int, update: ClientUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    client = db.query(Client).filter(Client.id == client_id, Client.user_id == current_user.id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    old = {"name": client.name, "phone": client.phone, "status": client.status}
    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(client, field, value)

    db.commit()
    db.refresh(client)

    _log_audit(db, current_user.id, "updated", client.id, old=old, new=update.model_dump(exclude_unset=True))
    db.commit()

    return client


@router.get("/{client_id}/risk")
def get_client_risk(client_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    client = db.query(Client).filter(Client.id == client_id, Client.user_id == current_user.id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    score = calculate_risk_score(client_id, db)
    client.risk_score = score
    db.commit()

    return {"client_id": client_id, "risk_score": score, "risk_level": get_risk_level(score)}


@router.delete("/{client_id}")
def delete_client(client_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    client = db.query(Client).filter(Client.id == client_id, Client.user_id == current_user.id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    _log_audit(db, current_user.id, "deleted", client.id, old={"name": client.name, "email": client.email})
    db.delete(client)
    db.commit()

    return {"message": "Client deleted"}