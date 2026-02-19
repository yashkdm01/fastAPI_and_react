from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime
import os
import uuid
import shutil
from database import get_db
from models.tables import Document
from utils.auth_dependencies import get_current_user

router = APIRouter(tags=["Documents"])

class DocumentResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    download_url: str 

    class Config:
        from_attributes = True

@router.get("", response_model=List[DocumentResponse])
def get_my_documents(
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    docs = db.query(Document).filter(Document.owner_id == current_user.id).all()
    
    scheme = request.headers.get("x-forwarded-proto", "http")
    base_url = f"{scheme}://{request.url.netloc}"
    
    results = []
    for doc in docs:
        filename = os.path.basename(doc.file_url)
        full_url = f"{base_url}/uploads/{filename}"
        
        results.append({
            "id": doc.id,
            "title": doc.title,
            "created_at": doc.created_at,
            "download_url": full_url
        })
        
    return results

@router.post("/upload")
def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    os.makedirs("uploads", exist_ok=True)
    
    file_ext = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_ext}"
    file_path = os.path.join("uploads", unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    new_doc = Document(
        title=file.filename,
        file_url=file_path,
        owner_id=current_user.id 
    )
    
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    return {"status": "success", "id": new_doc.id}

@router.delete("/{doc_id}")
def delete_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    doc = db.query(Document).filter(
        Document.id == doc_id, 
        Document.owner_id == current_user.id
    ).first()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if os.path.exists(doc.file_url):
        try:
            os.remove(doc.file_url)
        except Exception as e:
            print(f"Cleanup error: {e}")
        
    db.delete(doc)
    db.commit()
    return {"message": "Deleted successfully"}
