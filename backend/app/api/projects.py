from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_
from typing import List, Optional

from app.db.session import get_db
from app.db.models import Project, User, Ticket
from app.schemas.project import ProjectCreate, ProjectOut, TicketCreate, TicketOut, TicketUpdate
from app.api.deps import get_current_user

router = APIRouter(prefix="/projects", tags=["Projects"])

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
    db.add(new_project)
    await db.commit()
    await db.refresh(new_project)
    
    return {
        "id": new_project.id,
        "name": new_project.name,
        "description": new_project.description,
        "owner_id": new_project.owner_id,
        "tickets": []
    }

@router.get("/", response_model=List[ProjectOut])
async def get_projects(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Project).where(Project.owner_id == current_user.id)
    result = await db.execute(query)
    projects = result.scalars().all()
    
    return [
        {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "owner_id": p.owner_id,
            "tickets": [] 
        }
        for p in projects
    ]

@router.get("/{project_id}", response_model=ProjectOut)
async def get_project_details(
    project_id: int,
    search: Optional[str] = None,
    priority: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # fetch project
    query = select(Project).where(Project.id == project_id)
    result = await db.execute(query)
    project = result.scalars().first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    ticket_query = select(Ticket).where(Ticket.project_id == project_id)

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
    
    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "owner_id": project.owner_id,
        "tickets": tickets 
    }

@router.post("/{project_id}/tickets", response_model=TicketOut)
async def create_ticket(
    project_id: int,
    ticket_in: TicketCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        query = select(Project).where(Project.id == project_id)
        result = await db.execute(query)
        project = result.scalars().first()
        if not project:
             raise HTTPException(status_code=404, detail="Project not found")

        # Validate assignee if provided
        if ticket_in.assignee_id is not None:
            assignee_query = select(User).where(User.id == ticket_in.assignee_id)
            assignee_result = await db.execute(assignee_query)
            if not assignee_result.scalars().first():
                raise HTTPException(status_code=400, detail="Invalid assignee")

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
        await db.refresh(new_ticket)
        return new_ticket
    except Exception as e:
        await db.rollback()
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
    await db.refresh(ticket)
    return ticket

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