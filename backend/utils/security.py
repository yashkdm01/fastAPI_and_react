from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt
import os
from dotenv import load_dotenv
load_dotenv()

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

SECRET_KEY = os.getenv("SECRET_KEY", "your_fallback_secret_key_here")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
expire_env = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15")
ACCESS_TOKEN_EXPIRE_MINUTES = int(expire_env)

def create_access_token(data: dict, expire_delta: Optional[timedelta]= None):
    to_encode = data.copy()

    if expire_delta:
        expire = datetime.now(timezone.utc) + expire_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
