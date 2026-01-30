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

@router.post("/", response_model=ProjectOut)
async def create_project(
    project_in: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    #create the basic project object
    new_project = Project(
        name=project_in.name,
        description=project_in.description,
        owner_id=current_user.id
    )
    
    #handle Members Logic
    # start with the owner as the first member
    members_to_add = [current_user]

    # if the user selected other members, fetch them
    if project_in.member_ids:
        # Fetch all users whose IDs are in the list
        stmt = select(User).where(User.id.in_(project_in.member_ids))
        result = await db.execute(stmt)
        found_users = result.scalars().all()
        
        # add them to our list (avoiding duplicates if owner selected themselves)
        for u in found_users:
            if u.id != current_user.id:
                members_to_add.append(u)
    
    # assign the list to the relationship
    new_project.members = members_to_add

    db.add(new_project)
    await db.commit()
    
    # refresh and Load Relationships
    await db.refresh(new_project, attribute_names=["members"])
    
    return new_project

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
    
    return projects

@router.get("/{project_id}", response_model=ProjectOut)
async def get_project_details(
    project_id: int,
    search: Optional[str] = None,
    priority: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # fetch Project with Members
    query = select(Project).options(selectinload(Project.members)).where(Project.id == project_id)
    result = await db.execute(query)
    project = result.scalars().first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # fetch Tickets with Comments
    ticket_query = select(Ticket).options(selectinload(Ticket.comments)).where(Ticket.project_id == project_id)

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
    
    # combine manually for the response
    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "owner_id": project.owner_id,
        "members": project.members,
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

        # validate assignee if provided
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
        new_ticket.comments = []
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
    query = select(Ticket).options(selectinload(Ticket.comments)).where(Ticket.id == ticket_id, Ticket.project_id == project_id)
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

@router.post("/{project_id}/tickets/{ticket_id}/comments", response_model=CommentOut)
async def create_comment(
    project_id: int,
    ticket_id: int,
    comment_in: CommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # verify ticket exists
    query = select(Ticket).where(Ticket.id == ticket_id, Ticket.project_id == project_id)
    result = await db.execute(query)
    ticket = result.scalars().first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # create comment
    new_comment = Comment(
        content=comment_in.content,
        ticket_id=ticket_id,
        owner_id=current_user.id
    )
    db.add(new_comment)
    await db.commit()
    await db.refresh(new_comment)
    
    return new_comment
