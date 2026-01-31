from pydantic import BaseModel, EmailStr
from typing import Optional

# for User creation (signup)
class UserCreate(BaseModel):
    email: EmailStr
    password: str

# for User response (returning data to frontend)
class UserOut(BaseModel):
    id: int
    email: EmailStr
    is_active: bool
    is_supervisor: bool= False

    class Config:
        from_attributes = True

# for JWT token response
class Token(BaseModel):
    access_token: str
    token_type: str

# for token payload
class TokenData(BaseModel):
    id: Optional[int] = None
