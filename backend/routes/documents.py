import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from database import get_db
from models.invoice_document import InvoiceDocument
from models.invoice import Invoice
from models.user import User
from models.audit_log import AuditLog
from schemas.schemas import InvoiceDocumentOut
from auth_dependency import get_current_user
from typing import List
import json

router = APIRouter(prefix="/invoices", tags=["Invoice Documents"])

# Local storage folder (swap this path for S3 key in production)
UPLOAD_DIR = "invoice_files"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _log_audit(db, user_id, action, record_id, new=None):
    db.add(AuditLog(
        user_id=user_id,
        action=action,
        table_name="invoice_documents",
        record_id=record_id,
        new_value=json.dumps(new) if new else None,
    ))


@router.post("/{invoice_id}/upload", response_model=InvoiceDocumentOut)
def upload_invoice_file(
    invoice_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.user_id == current_user.id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    # Calculate next version number
    existing_count = db.query(InvoiceDocument).filter(InvoiceDocument.invoice_id == invoice_id).count()
    version = existing_count + 1

    # Save file to disk
    file_ext = os.path.splitext(file.filename)[1]
    save_name = f"inv_{invoice_id}_v{version}{file_ext}"
    save_path = os.path.join(UPLOAD_DIR, save_name)

    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(save_path)

    doc = InvoiceDocument(
        invoice_id=invoice_id,
        file_name=file.filename,
        file_type=file.content_type,
        file_size=file_size,
        storage_path=save_path,
        version=version,
        uploaded_by=current_user.id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    _log_audit(db, current_user.id, "file_uploaded", doc.id, new={"file_name": file.filename, "version": version})
    db.commit()

    return doc


@router.get("/{invoice_id}/documents", response_model=List[InvoiceDocumentOut])
def list_invoice_files(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.user_id == current_user.id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    return db.query(InvoiceDocument).filter(InvoiceDocument.invoice_id == invoice_id).order_by(InvoiceDocument.version.desc()).all()


@router.get("/{invoice_id}/download/{doc_id}")
def download_invoice_file(
    invoice_id: int,
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.user_id == current_user.id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    doc = db.query(InvoiceDocument).filter(InvoiceDocument.id == doc_id, InvoiceDocument.invoice_id == invoice_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if not os.path.exists(doc.storage_path):
        raise HTTPException(status_code=410, detail="File no longer available on disk")

    _log_audit(db, current_user.id, "file_downloaded", doc.id, new={"file_name": doc.file_name})
    db.commit()

    return FileResponse(path=doc.storage_path, filename=doc.file_name, media_type=doc.file_type or "application/octet-stream")


@router.delete("/{invoice_id}/documents/{doc_id}")
def delete_invoice_file(
    invoice_id: int,
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.user_id == current_user.id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    doc = db.query(InvoiceDocument).filter(InvoiceDocument.id == doc_id, InvoiceDocument.invoice_id == invoice_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Remove file from disk
    if os.path.exists(doc.storage_path):
        os.remove(doc.storage_path)

    _log_audit(db, current_user.id, "file_deleted", doc.id, new={"file_name": doc.file_name})
    db.delete(doc)
    db.commit()

    return {"message": "Document deleted"}