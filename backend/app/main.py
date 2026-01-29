from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, projects
from app.db.session import engine, Base

# Create tables logic
async def init_db():
    async with engine.begin() as conn:
        # This actually creates the tables in the database
        await conn.run_sync(Base.metadata.create_all)

app = FastAPI(
    title="Jira Clone API",
)

origins = [
    "http://localhost:5173",           # Allows your local laptop
    "https://fast-api-and-react-git-jiraclone-yash-kadams-projects-4187f088.vercel.app/",   
    "*"                                # Failsafe: Allows everyone (good for testing)
]
# CORS Configuration
# We use ["*"] to allow YOUR Vercel frontend to connect without issues.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],  
)

@app.on_event("startup")
async def on_startup():
    await init_db()

# Include your API routes
app.include_router(auth.router)
app.include_router(projects.router)

@app.get("/",)
async def root():
    return {
        "message": "Jira API is running"
    }
