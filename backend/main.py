from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, Session, relationship
from pydantic import BaseModel
import uvicorn

SQLALCHEMY_DATABASE_URL = "sqlite:///./reddit_clone.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- MODELS ---
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String) 

class Community(Base):
    __tablename__ = "communities"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    slug = Column(String, unique=True, index=True)

class Post(Base):
    __tablename__ = "posts"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    content = Column(String)
    community_id = Column(Integer, ForeignKey("communities.id"))
    author_id = Column(Integer, ForeignKey("users.id"))
    
    community = relationship("Community")
    author = relationship("User")
    comments = relationship("Comment", back_populates="post")
    votes = relationship("Vote", back_populates="post")

class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    content = Column(String)
    post_id = Column(Integer, ForeignKey("posts.id"))
    author_id = Column(Integer, ForeignKey("users.id"))
    
    post = relationship("Post", back_populates="comments")
    author = relationship("User")

class Vote(Base):
    __tablename__ = "votes"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String) # 'up' or 'down'
    user_id = Column(Integer, ForeignKey("users.id"))
    post_id = Column(Integer, ForeignKey("posts.id"))
    
    post = relationship("Post", back_populates="votes")

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Reddit Clone MVP")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

# --- SCHEMAS ---
class UserCreate(BaseModel): username: str; password: str
class CommunityCreate(BaseModel): name: str; slug: str
class PostCreate(BaseModel): title: str; content: str; community_id: int; author_id: int
class CommentCreate(BaseModel): content: str; post_id: int; author_id: int
class VoteCreate(BaseModel): type: str; post_id: int; user_id: int

# --- ROUTES ---
@app.post("/api/auth/signup")
def signup(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username taken")
    db_user = User(username=user.username, password=user.password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return {"message": "Success", "user_id": db_user.id, "username": db_user.username}

@app.post("/api/auth/login")
def login(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username, User.password == user.password).first()
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    return {"message": "Success", "user_id": db_user.id, "username": db_user.username}

@app.post("/api/communities")
def create_community(comm: CommunityCreate, db: Session = Depends(get_db)):
    db_comm = Community(name=comm.name, slug=comm.slug)
    db.add(db_comm)
    db.commit()
    return db_comm

@app.get("/api/communities")
def get_communities(db: Session = Depends(get_db)):
    return db.query(Community).all()

@app.post("/api/posts")
def create_post(post: PostCreate, db: Session = Depends(get_db)):
    db_post = Post(**post.dict())
    db.add(db_post)
    db.commit()
    return db_post

@app.post("/api/comments")
def add_comment(comment: CommentCreate, db: Session = Depends(get_db)):
    db_comment = Comment(**comment.dict())
    db.add(db_comment)
    db.commit()
    return {"message": "Comment added"}

@app.post("/api/votes")
def handle_vote(vote: VoteCreate, db: Session = Depends(get_db)):
    # Check if user already voted on this post
    existing_vote = db.query(Vote).filter(Vote.post_id == vote.post_id, Vote.user_id == vote.user_id).first()
    if existing_vote:
        existing_vote.type = vote.type # Update vote
    else:
        db.add(Vote(**vote.dict())) # New vote
    db.commit()
    return {"message": "Vote recorded"}

@app.get("/api/posts")
def get_posts(db: Session = Depends(get_db)):
    posts = db.query(Post).all()
    result = []
    for p in posts:
        upvotes = sum(1 for v in p.votes if v.type == 'up')
        downvotes = sum(1 for v in p.votes if v.type == 'down')
        total_score = upvotes - downvotes
        comments = [{"id": c.id, "content": c.content, "author": c.author.username} for c in p.comments]
        
        result.append({
            "id": p.id, "title": p.title, "content": p.content,
            "community": p.community.name, "author": p.author.username,
            "score": total_score, "comments": comments
        })
    # Sort by newest first
    return result[::-1]

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)