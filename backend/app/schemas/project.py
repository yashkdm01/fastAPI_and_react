from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class CommentCreate(BaseModel):
    content: str

class CommentOut(BaseModel):
    id: int
    content: str
    owner_id: int 
    ticket_id: int 
    created_at: datetime 
    
    class Config:
        from_attributes = True


class TicketCreate(BaseModel):
    title: str
    description: str
    status: str = "TODO"
    priority: str = "MEDIUM"
    assignee_id: Optional[int] = None

class TicketUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    assignee_id: Optional[int] = None

class TicketOut(BaseModel):
    id: int
    title: str
    description: str
    status: str
    priority: str
    project_id: int
    assignee_id: Optional[int] = None
    
    comments: List[CommentOut] = [] 

    class Config:
        from_attributes = True


class ProjectMember(BaseModel):
    id: int
    email: str
    class Config:
        from_attributes = True

class ProjectCreate(BaseModel):
    name: str
    description: str
    # NEW: Accept a list of User IDs to add as members
    member_ids: List[int] = [] 

class ProjectOut(BaseModel):
    id: int
    name: str
    description: str
    owner_id: int
    tickets: List[TicketOut] = [] 
    
    # NEW: Return the list of members to the frontend
    members: List[ProjectMember] = []

    class Config:
        from_attributes = True
