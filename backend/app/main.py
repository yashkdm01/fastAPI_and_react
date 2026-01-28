from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import auth, projects
from app.db.session import engine, Base

# Create tables
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

app = FastAPI(
    title=settings.PROJECT_NAME,
)

# this tells the backend to trust frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",    
        "http://127.0.0.1:5173",    
    ],
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],  
)

@app.on_event("startup")
async def on_startup():
    await init_db()

#including auth routes
app.include_router(auth.router)
app.include_router(projects.router)

@app.get("/",)
async def root():
    return{
        "message": "Jira API is running"
    }
