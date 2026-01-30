from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class UserBasic(BaseModel):
    id: int
    email: str

    class Config:
        from_attributes = True

# --- PROJECT SCHEMAS ---
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    member_ids: List[int] = []

class ProjectUpdate(ProjectBase):
    pass

class ProjectOut(ProjectBase):
    id: int
    owner_id: int
    created_at: Optional[datetime]
    
    members: List[UserBasic] = [] 

    class Config:
        from_attributes = True

class TicketCreate(BaseModel):
    title: str
    description: Optional[str]
    status: str = "todo"
    priority: str = "medium"
    assignee_id: Optional[int] = None

class TicketUpdate(BaseModel):
    title: Optional[str]
    description: Optional[str]
    status: Optional[str]
    priority: Optional[str]
    assignee_id: Optional[int]

class TicketOut(TicketCreate):
    id: int
    project_id: int
    class Config:
        from_attributes = True

class CommentCreate(BaseModel):
    content: str

class CommentOut(CommentCreate):
    id: int
    owner_id: int
    created_at: Optional[datetime]
    class Config:
        from_attributes = True
