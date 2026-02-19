from sqlalchemy.orm import Session
from models.tables import AuditLog, Document
import uuid
from datetime import datetime  

def log_action(db: Session, doc_id: int, user_id: int, action: str, ip: str = "127.0.0.1"):
    new_log = AuditLog(
        document_id = doc_id,
        performed_by = user_id,
        action = action,
        ip_address = ip,
        timestamp = datetime.utcnow()
    )
    db.add(new_log)
    db.commit()

def generate_public_link(db: Session, doc_id: int):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        return {"error": "Document not found"}
    
    share_token = str(uuid.uuid4())
    doc.share_token = share_token 
    db.commit()
    
    public_url = f"http://localhost:5173/public/view/{share_token}"
    return {"share_url": public_url}