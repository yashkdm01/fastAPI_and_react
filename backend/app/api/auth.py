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

@router.post("/login")  # removed response_model for debug safety
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: AsyncSession = Depends(get_db)
):
    print(f"\n🧐 LOGIN DEBUG START")
    print(f"📥 Received Email (Username): '{form_data.username}'")
    print(f"📥 Received Password: '{form_data.password}'")

    # 1. Query the User
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalars().first()
    
    # 2. Check if User Exists
    if not user:
        print(f"❌ ERROR: User not found in DB!")
        # Debug: Print all users to see what's actually there
        all_users = await db.execute(select(User))
        print(f"📋 Available Users in DB: {[u.email for u in all_users.scalars().all()]}")
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    print(f"✅ User Found: ID={user.id}, Email='{user.email}'")

    # 3. Verify Password (Safe Attribute Check)
    # Check if the model uses 'hashed_password' or 'password_hash'
    stored_hash = getattr(user, 'hashed_password', getattr(user, 'password_hash', None))
    
    if not stored_hash:
        print(f"❌ CRITICAL ERROR: No password field found on User model (checked 'hashed_password' and 'password_hash')")
        raise HTTPException(status_code=500, detail="Database schema error")

    print(f"🔐 Stored Hash: {stored_hash[:10]}...") # Print first 10 chars
    
    is_valid = verify_password(form_data.password, stored_hash)
    
    if not is_valid:
        print(f"❌ ERROR: Password Verification Failed!")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    print(f"🚀 SUCCESS: Login successful. Generating token.")
    
    access_token = create_access_token(subject=str(user.id))
    return {"access_token": access_token, "token_type": "bearer"}

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
