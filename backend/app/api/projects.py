from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import or_
from typing import List, Optional

from app.db.session import get_db
from app.db.models import Project, User, Ticket, Comment
from app.schemas.project import ProjectCreate, ProjectOut, TicketCreate, TicketOut, TicketUpdate, CommentCreate, CommentOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/projects", tags=["Projects"])

# --- HELPER: Manual Serializers (The Anti-Crash Shield) ---
def serialize_user(user):
    if not user: return None
    return {
        "id": user.id,
        "email": user.email,
        "is_active": user.is_active,
        "is_supervisor": user.is_supervisor
    }

def serialize_ticket(ticket):
    return {
        "id": ticket.id,
        "title": ticket.title,
        "description": ticket.description,
        "status": ticket.status,
        "priority": ticket.priority,
        "assignee_id": ticket.assignee_id,
        "project_id": ticket.project_id,
        "created_at": ticket.created_at,
        "assignee": serialize_user(ticket.assignee), # Safe Manual Conversion
        "comments": [] # Keep comments simple for now to prevent recursion
    }

@router.post("/", response_model=ProjectOut)
async def create_project(
    project_in: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_project = Project(
        name=project_in.name,
        description=project_in.description,
        owner_id=current_user.id
    )
    
    members_to_add = [current_user]
    if project_in.member_ids:
        stmt = select(User).where(User.id.in_(project_in.member_ids))
        result = await db.execute(stmt)
        found_users = result.scalars().all()
        for u in found_users:
            if u.id != current_user.id:
                members_to_add.append(u)
    
    new_project.members = members_to_add
    db.add(new_project)
    await db.commit()
    
    # MANUAL RETURN
    return {
        "id": new_project.id,
        "name": new_project.name,
        "description": new_project.description,
        "owner_id": new_project.owner_id,
        "created_at": new_project.created_at,
        "members": [serialize_user(m) for m in members_to_add], 
        "tickets": [] 
    }

@router.get("/", response_model=List[ProjectOut])
async def get_projects(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Project).options(selectinload(Project.members)).where(
        Project.members.any(User.id == current_user.id)
    )
    result = await db.execute(query)
    projects = result.scalars().all()
    
    safe_projects = []
    for p in projects:
        safe_projects.append({
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "owner_id": p.owner_id,
            "created_at": p.created_at,
            "members": [serialize_user(m) for m in p.members],
            "tickets": [] 
        })
        
    return safe_projects

@router.get("/{project_id}", response_model=ProjectOut)
async def get_project_details(
    project_id: int,
    search: Optional[str] = None,
    priority: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Fetch Project
    query = select(Project).options(selectinload(Project.members)).where(Project.id == project_id)
    result = await db.execute(query)
    project = result.scalars().first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # 2. Fetch Tickets with Assignee
    ticket_query = select(Ticket).options(
        selectinload(Ticket.assignee)
    ).where(Ticket.project_id == project_id)

    if priority and priority != "ALL":
        ticket_query = ticket_query.where(Ticket.priority == priority)

    if search:
        search_term = f"%{search}%"
        ticket_query = ticket_query.where(
            or_(
                Ticket.title.ilike(search_term),
                Ticket.description.ilike(search_term)
            )
        )

    tickets_result = await db.execute(ticket_query)
    tickets = tickets_result.scalars().all()
    
    # 3. MANUAL CONVERSION (The Fix for "Loading...")
    safe_tickets = [serialize_ticket(t) for t in tickets]
    
    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "owner_id": project.owner_id,
        "created_at": project.created_at,
        "members": [serialize_user(m) for m in project.members],
        "tickets": safe_tickets
    }

@router.post("/{project_id}/tickets", response_model=TicketOut)
async def create_ticket(
    project_id: int,
    ticket_in: TicketCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Check Project
        query = select(Project).where(Project.id == project_id)
        result = await db.execute(query)
        project = result.scalars().first()
        if not project:
             raise HTTPException(status_code=404, detail="Project not found")

        # Create Ticket
        new_ticket = Ticket(
            title=ticket_in.title,
            description=ticket_in.description,
            status=ticket_in.status,
            priority=ticket_in.priority,
            assignee_id=ticket_in.assignee_id,
            project_id=project_id
        )
        db.add(new_ticket)
        await db.commit()
        
        # Reload with Assignee
        query = select(Ticket).where(Ticket.id == new_ticket.id).options(
            selectinload(Ticket.assignee)
        )
        result = await db.execute(query)
        loaded_ticket = result.scalars().first()
        
        # Manual Return (Fixes "Ticket not showing up")
        return serialize_ticket(loaded_ticket)

    except Exception as e:
        await db.rollback()
        print(f"Server Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create ticket: {str(e)}")

@router.patch("/{project_id}/tickets/{ticket_id}", response_model=TicketOut)
async def update_ticket(
    project_id: int,
    ticket_id: int,
    ticket_update: TicketUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Ticket).where(Ticket.id == ticket_id, Ticket.project_id == project_id)
    result = await db.execute(query)
    ticket = result.scalars().first()

    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if ticket_update.status:
        ticket.status = ticket_update.status
    if ticket_update.priority:
        ticket.priority = ticket_update.priority
    if ticket_update.assignee_id is not None:
        ticket.assignee_id = ticket_update.assignee_id

    await db.commit()
    
    # Reload with Assignee
    query = select(Ticket).where(Ticket.id == ticket.id).options(
        selectinload(Ticket.assignee)
    )
    result = await db.execute(query)
    updated_ticket = result.scalars().first()
    
    # Manual Return (Fixes Drag and Drop)
    return serialize_ticket(updated_ticket)

@router.delete("/{project_id}/tickets/{ticket_id}", status_code=204)
async def delete_ticket(
    project_id: int,
    ticket_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Ticket).where(Ticket.id == ticket_id, Ticket.project_id == project_id)
    result = await db.execute(query)
    ticket = result.scalars().first()
    
    if ticket:
        await db.delete(ticket)
        await db.commit()
    return None

# Comments (Keep simple for now)
@router.post("/{project_id}/tickets/{ticket_id}/comments", response_model=CommentOut)
async def create_comment(
    project_id: int,
    ticket_id: int,
    comment_in: CommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_comment = Comment(
        content=comment_in.content,
        ticket_id=ticket_id,
        owner_id=current_user.id
    )
    db.add(new_comment)
    await db.commit()
    
    query = select(Comment).where(Comment.id == new_comment.id).options(
        selectinload(Comment.owner)
    )
    result = await db.execute(query)
    loaded_comment = result.scalars().first()
    
    return {
        "id": loaded_comment.id,
        "content": loaded_comment.content,
        "created_at": loaded_comment.created_at,
        "owner": serialize_user(loaded_comment.owner)
    }
