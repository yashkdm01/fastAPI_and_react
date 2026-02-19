from fastapi import APIRouter, Depends, HTTPException, Request, Form, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models.tables import Signature, Document, DocumentStatus, AuditLog
from utils.auth_dependencies import get_current_user
from services.logic import log_action, generate_public_link
from services.pdf_service import sign_pdf
import uuid
import os
import shutil

router = APIRouter(prefix="/signatures", tags=["Signatures"])

class SignatureCreate(BaseModel):
    document_id: int
    x_position: int
    y_position: int
    page_number: int

@router.post("/")
def create_signature(
    document_id: int = Form(...),
    x_position: int = Form(...),
    y_position: int = Form(...),
    width: int = Form(...),  
    height: int = Form(...),  
    page_number: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    doc = (
        db.query(Document)
        .filter(Document.id == document_id, Document.owner_id == current_user.id)
        .first()
    )

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    os.makedirs("temp_signatures", exist_ok=True)
    sig_filename = f"sig_{uuid.uuid4()}.png"
    sig_path = os.path.join("temp_signatures", sig_filename)

    with open(sig_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        signed_pdf_path = sign_pdf(
            doc.file_url, sig_path, x_position, y_position, page_number, width, height
        )
        doc.file_url = signed_pdf_path
        
        audit_entry = AuditLog(
            document_id=document_id,
            action=f"SIGNED: Position({x_position},{y_position}) Dimensions({width}x{height})"
        )
        db.add(audit_entry)
        
        db.commit()

    except Exception as e:
        db.rollback()
        print(f"Burning failed: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to burn signature: {str(e)}"
        )
    finally:
        if os.path.exists(sig_path):
            os.remove(sig_path)

    return {"status": "success", "message": "Signature burned successfully"}

class StatusUpdate(BaseModel):
    status: DocumentStatus
    reason: str = None

@router.put("/{sig_id}/status")
def update_signature_status(
    sig_id: int,
    update_data: StatusUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    sig = db.query(Signature).filter(Signature.id == sig_id).first()
    if not sig:
        raise HTTPException(404, detail="signature not found")

    sig.status = update_data.status
    if update_data.status == DocumentStatus.REJECTED:
        sig.rejection_reason = update_data.reason

    log_action(
        db,
        sig.document_id,
        current_user.id,
        f"Marked as {update_data.status}",
        request.client.host,
    )
    
    audit_entry = AuditLog(
        document_id=sig.document_id,
        action=f"STATUS_CHANGE: {update_data.status}"
    )
    db.add(audit_entry)
    
    db.commit()
    return {"status": "updated", "new_status": sig.status}

@router.post("/{doc_id}/share")
def get_share_link(doc_id: int, db: Session = Depends(get_db)):
    return generate_public_link(db, doc_id)