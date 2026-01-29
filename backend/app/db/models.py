from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.db.session import Base
import datetime  # <--- NEW: Needed for timestamps

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

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="projects")
    tickets = relationship("Ticket", back_populates="project", cascade="all, delete-orphan")

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
    
    # NEW: Relationship to Comments
    # "cascade='all, delete-orphan'" means if you delete a ticket, 
    # all its comments get deleted too. No ghost data!
    comments = relationship("Comment", back_populates="ticket", cascade="all, delete-orphan")

# ---------------------------------------------------------
# NEW MODEL: Comments
# ---------------------------------------------------------
class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    # Who wrote this?
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User")

    # Which ticket is this for?
    ticket_id = Column(Integer, ForeignKey("tickets.id"))
    ticket = relationship("Ticket", back_populates="comments")
