from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, projects, users 
from app.db.session import engine, Base

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

app = FastAPI(
    title="Jira Clone API",
)

origins = [      
    "http://localhost:5173",
    "https://jiracloneapi.vercel.app",
    "https://jiracloneapi.vercel.app/",
    "*"                              
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],  
)

@app.on_event("startup")
async def on_startup():
    await init_db()

app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(users.router) #

@app.get("/",)
async def root():
    return {
        "message": "Jira API is running"
    }
