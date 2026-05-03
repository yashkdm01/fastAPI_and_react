from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from config.database import engine, get_db, Base
from models import schemas
from middleware.gateway import api_gateway_middleware
from services.celery_worker import calculate_billing_for_user

# Initialize DB Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="MeterFlow API Gateway")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Custom Gateway Middleware
app.middleware("http")(api_gateway_middleware)

# --- Routes ---
@app.post("/internal/keys/generate")
def generate_key(db: Session = Depends(get_db)):
    """Creates a mock active key for testing the gateway."""
    import secrets

    # --- RELATIONAL INTEGRITY FIX ---
    # Check if a mock user exists; if not, create one to avoid 500 error
    mock_user = db.query(schemas.User).filter(schemas.User.id == 1).first()
    if not mock_user:
        mock_user = schemas.User(id=1, email="admin@meterflow.com", role="Admin")
        db.add(mock_user)
        db.commit()

    # Check if a mock API exists linked to that user; if not, create it[cite: 1, 2]
    mock_api = db.query(schemas.API).filter(schemas.API.id == 1).first()
    if not mock_api:
        mock_api = schemas.API(id=1, user_id=1, name="Default API", base_url="https://jsonplaceholder.typicode.com")
        db.add(mock_api)
        db.commit()
    # --------------------------------

    new_key = f"sk_live_{secrets.token_urlsafe(16)}"
    # Now api_id=1 is guaranteed to exist in the database[cite: 1, 2]
    db_key = schemas.APIKey(key=new_key, status="active", api_id=1)
    db.add(db_key)
    db.commit()
    return {"api_key": new_key}

@app.get("/internal/dashboard")
def get_dashboard_data(db: Session = Depends(get_db)):
    logs = db.query(schemas.UsageLog).all()
    total = len(logs) #
    errors = sum(1 for log in logs if log.status >= 400) #
    active_keys = db.query(schemas.APIKey).filter(schemas.APIKey.status == "active").count() #
    
    return {
        "total_requests": total,
        "active_keys": active_keys,
        "error_rate": f"{(errors/total * 100) if total else 0:.1f}%",
        "revenue_estimate": sum(l.latency for l in logs) * 0.0001 if logs else 0, # Added fallback
        "logs": [{"endpoint": l.endpoint, "status": l.status, "latency": l.latency} for l in logs[-10:]]
    }

@app.post("/internal/billing/run")
def trigger_billing_job(user_id: int, total_req: int):
    """Triggers the Celery async worker."""
    task = calculate_billing_for_user.delay(user_id, total_req)
    return {"message": "Billing calculation started", "task_id": task.id}