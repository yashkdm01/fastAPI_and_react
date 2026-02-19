import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.tables import Document

router = APIRouter(prefix="/public", tags=["Public Access"])

@router.get("/view/{token}")
def get_public_document(token: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.share_token == token).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Link invalid")
    filename = os.path.basename(doc.file_url)
    clean_url = f"http://localhost:8000/uploads/{filename}"
        
    return {
        "title": doc.title,
        "file_url": clean_url
    }