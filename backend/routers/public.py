import os
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_db
from models.tables import Document

router = APIRouter(tags=["Public Access"])

@router.get("/view/{token}")
def get_public_document(token: str, request: Request, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.share_token == token).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Link invalid")
    
    filename = os.path.basename(doc.file_url)
    scheme = request.headers.get("x-forwarded-proto", "http")
    base_url = f"{scheme}://{request.url.netloc}"
    clean_url = f"{base_url}/uploads/{filename}"
        
    return {
        "title": doc.title,
        "file_url": clean_url
    }
