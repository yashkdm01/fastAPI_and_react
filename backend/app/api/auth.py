from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from pydantic import BaseModel

from app.db.session import get_db
from app.db.models import User
from app.core.security import verify_password, create_access_token, get_password_hash
from app.schemas.user import UserCreate, UserOut, Token
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/signup", response_model=UserOut)
async def signup(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user_in.email))
    user = result.scalars().first()
    if user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    new_user = User(
        email=user_in.email,
        password_hash=get_password_hash(user_in.password)
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    # fetch user 
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalars().first()

    # verify user and password
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # generate token
    access_token = create_access_token(subject=str(user.id))
    
    return {
        "access_token": access_token, 
        "token_type": "bearer"
    }

class UserListOut(BaseModel):
    id: int
    email: str
    is_active: bool 

    class Config:
        from_attributes = True

@router.get("/users", response_model=List[UserListOut])
async def get_all_users(
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(User))
    users = result.scalars().all()
    return users 


@router.patch("/users/{user_id}")
async def update_user_status(
    user_id: int,
    is_active: bool = Body(..., embed=True), 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Fetch User
    query = select(User).where(User.id == user_id)
    result = await db.execute(query)
    user_to_update = result.scalars().first()

    if not user_to_update:
        raise HTTPException(status_code=404, detail="User not found")

    # 2. Update
    user_to_update.is_active = is_active
    await db.commit()
    await db.refresh(user_to_update)
    
    return {"message": "Status updated", "is_active": user_to_update.is_active}


@router.delete("/users/{user_id}", status_code=204)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Fetch User
    query = select(User).where(User.id == user_id)
    result = await db.execute(query)
    user_to_delete = result.scalars().first()
    
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="User not found")

    # 2. Delete
    await db.delete(user_to_delete)
    await db.commit()
    return None
