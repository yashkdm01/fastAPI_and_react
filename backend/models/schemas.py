from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from config.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True) # [cite: 164, 165]
    email = Column(String, unique=True, index=True) # [cite: 165]
    password_hash = Column(String) # [cite: 165]
    role = Column(String, default="API Owner") # [cite: 165]

class API(Base):
    __tablename__ = "apis"
    id = Column(Integer, primary_key=True, index=True) # [cite: 166, 167]
    user_id = Column(Integer, ForeignKey("users.id")) # [cite: 167]
    name = Column(String) # [cite: 167]
    base_url = Column(String) # [cite: 167]

class APIKey(Base):
    __tablename__ = "api_keys"
    id = Column(Integer, primary_key=True, index=True) # [cite: 168, 169]
    api_id = Column(Integer, ForeignKey("apis.id")) # [cite: 169]
    key = Column(String, unique=True, index=True) # [cite: 169]
    status = Column(String, default="active") # [cite: 169]

class UsageLog(Base):
    __tablename__ = "usage_logs"
    id = Column(Integer, primary_key=True, index=True) # [cite: 170, 171]
    api_key = Column(String, index=True) # [cite: 171]
    endpoint = Column(String) # [cite: 171]
    timestamp = Column(DateTime, default=datetime.utcnow) # [cite: 171]
    status = Column(Integer) # [cite: 171]
    latency = Column(Float) # [cite: 142]

class Billing(Base):
    __tablename__ = "billing"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id")) # [cite: 172, 173]
    total_requests = Column(Integer, default=0) # [cite: 173]
    amount = Column(Float, default=0.0) # [cite: 173]
    status = Column(String, default="pending") # [cite: 173]