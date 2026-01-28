from pydantic import BaseModel
from typing import List, Optional

# ticket schemas
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

    class Config:
        from_attributes = True

# project schemas
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