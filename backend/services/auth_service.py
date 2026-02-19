from sqlalchemy.orm import Session
from models.tables import User
from schemas.auth import UserCreate
from utils.security import hash_password

def create_user(db: Session, user: UserCreate):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        return None

    hashed_pwd = hash_password(user.password)

    db_user = User(email=user.email, password_hash = hashed_pwd)

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user