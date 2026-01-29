from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime  # <--- NEW: Need this for timestamps

# ---------------------------------------------------------
# NEW: COMMENT SCHEMAS
# What: Defines valid data for comments
# Use: Ensures users can't send empty junk or malicious data
# ---------------------------------------------------------
class CommentCreate(BaseModel):
    content: str

class CommentOut(BaseModel):
    id: int
    content: str
    owner_id: int  # Who wrote it?
    ticket_id: int # Which ticket?
    created_at: datetime # When?
    
    # We allow the frontend to treat this DB object as JSON
    class Config:
        from_attributes = True

# ---------------------------------------------------------
# TICKET SCHEMAS
# ---------------------------------------------------------
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
    
    # NEW: When we fetch a ticket, bring the comments too!
    comments: List[CommentOut] = [] 

    class Config:
        from_attributes = True

# ---------------------------------------------------------
# PROJECT SCHEMAS
# ---------------------------------------------------------
class ProjectCreate(BaseModel):
    name: str
    description: str

class ProjectOut(BaseModel):
    id: int
    name: str
    description: str
    owner_id: int
    tickets: List[TicketOut] = [] 

    class Config:
        from_attributes = True
