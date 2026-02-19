from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base
import enum

class DocumentStatus(str, enum.Enum):
    PENDING = "pending"
    SIGNED = "signed"
    REJECTED = "rejected"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    documents = relationship("Document", back_populates="owner", cascade="all, delete")

class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    file_url = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    owner_id = Column(Integer, ForeignKey("users.id"))
    share_token = Column(String, unique=True, nullable=True) # THIS IS KEY
    owner = relationship("User", back_populates="documents")
    signatures = relationship("Signature", back_populates="document")
    audit_logs = relationship("AuditLog", back_populates="document")

class Signature(Base):
    __tablename__ = "signatures"
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    page_number = Column(Integer, default=1)
    x_position = Column(Integer)
    y_position = Column(Integer)
    status = Column(Enum(DocumentStatus), default=DocumentStatus.PENDING)
    rejection_reason = Column(String, nullable=True) 
    signed_at = Column(DateTime, nullable=True)
    document = relationship("Document", back_populates="signatures")
    signer = relationship("User")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    action = Column(String)
    performed_by = Column(Integer, ForeignKey("users.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String, nullable=True)
    document = relationship("Document", back_populates="audit_logs")