# backend/main.py
import os
import shutil
import requests
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load secure environment variables from .env file
load_dotenv()

app = FastAPI(title="Neural Transcription API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "temp_audio"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Fetch the API key securely
STT_API_KEY = os.getenv("DEEPGRAM_API_KEY")

@app.post("/api/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Receives audio, saves it temporarily, streams it to Deepgram STT,
    and returns the highly accurate neural transcription.
    """
    if not file.filename.endswith(('.wav', '.webm', '.mp3', '.ogg')):
        raise HTTPException(status_code=400, detail="Unsupported file format")

    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    # 1. Save the blob from React to disk
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        # 2. Safety Check
        if not STT_API_KEY:
            return {
                "status": "error",
                "transcript": "SYSTEM FAULT: Missing API Key. Check your backend/.env file."
            }

        # 3. Stream to Deepgram Neural Engine
        with open(file_path, "rb") as audio_file:
            # Using the Nova-2 model for maximum speed and accuracy
            url = "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true"
            headers = {
                "Authorization": f"Token {STT_API_KEY}",
                "Content-Type": "audio/webm"
            }
            
            # Execute the request
            response = requests.post(url, headers=headers, data=audio_file)
            response.raise_for_status() # Will throw an exception if the API rejects us
            
            # 4. Parse the complex JSON response
            data = response.json()
            actual_transcript = data['results']['channels'][0]['alternatives'][0]['transcript']
        
        return {
            "status": "success",
            "filename": file.filename,
            "transcript": actual_transcript or "[Audio recognized, but no speech detected]"
        }
        
    except requests.exceptions.RequestException as e:
        print(f"External API Error: {e}")
        raise HTTPException(status_code=502, detail="Failed to communicate with transcription provider")
        
    finally:
        # 5. Zero-Trace Cleanup: Always delete the temporary audio file
        if os.path.exists(file_path):
            os.remove(file_path)