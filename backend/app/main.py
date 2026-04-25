# backend/app/main.py

# importing required stuff for our api
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from dotenv import load_dotenv

# loading environment variables from .env file so our api key actually works
load_dotenv()

# creating the main app instance
app = FastAPI(title="AI Data Analyst API", version="1.0.0")

# adding cors so our react frontend can talk to this backend without errors
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# linking our api routes to the main app
app.include_router(router)

# simple health check route to see if server is running
@app.get("/health")
async def health_check():
    return {"status": "system_operational"}