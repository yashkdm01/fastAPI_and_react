from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.session import get_db
from app.db.models import User
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/users", tags=["Users"])

class UserDTO(BaseModel):
    id: int
    email: str
    
    class Config:
        orm_mode = True

@router.get("/", response_model=List[UserDTO])
async def read_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User))
    users = result.scalars().all()
    return users
