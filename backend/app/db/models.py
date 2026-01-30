from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Table
from sqlalchemy.orm import relationship
from app.db.session import Base
import datetime 

project_members = Table(
    'project_members',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('project_id', Integer, ForeignKey('projects.id'), primary_key=True)
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    is_active = Column(Boolean, default=True)
    is_supervisor = Column(Boolean, default=False)

    # Standard relationships
    projects = relationship("Project", back_populates="owner")
    tickets_assigned = relationship("Ticket", back_populates="assignee")

    # NEW: Projects I am a member of (but not necessarily owner)
    projects_member_of = relationship(
        "Project", 
        secondary=project_members, 
        back_populates="members"
    )

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="projects")
    tickets = relationship("Ticket", back_populates="project", cascade="all, delete-orphan")

    members = relationship(
        "User", 
        secondary=project_members, 
        back_populates="projects_member_of"
    )

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    status = Column(String, default="TODO")
    priority = Column(String, default="MEDIUM")
    
    project_id = Column(Integer, ForeignKey("projects.id"))
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    project = relationship("Project", back_populates="tickets")
    assignee = relationship("User", back_populates="tickets_assigned")
    
    comments = relationship("Comment", back_populates="ticket", cascade="all, delete-orphan")

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User")

    ticket_id = Column(Integer, ForeignKey("tickets.id"))
    ticket = relationship("Ticket", back_populates="comments")
