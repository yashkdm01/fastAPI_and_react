from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, documents, signatures, public 
from database import engine, Base
from fastapi.staticfiles import StaticFiles
import os

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Signature App API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173",
                  "https://fast-api-and-react.vercel.app",
                  "https://fast-api-and-react.vercel.app/"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(documents.router, prefix="/documents", tags=["documents"])
app.include_router(signatures.router, prefix="/signatures", tags=["signatures"])
app.include_router(public.router, prefix="/public", tags=["public"])

@app.get("/")
def root():
    return {"Radhe Radhe": "We are on"}

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
