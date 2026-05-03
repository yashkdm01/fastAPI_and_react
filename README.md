#  MeterFlow: Usage-Based API Metering & Billing Platform

MeterFlow is a high-performance, full-stack API Gateway designed to help SaaS providers meter API usage, enforce security via rate limiting, and automate usage-based billing logic.

## 🛠️ Technical Architecture
*   **API Gateway Layer**: Custom FastAPI middleware that intercepts, validates, and forwards requests to upstream services.
*   **Security & Authentication**: Strict X-API-Key validation against a PostgreSQL database.
*   **Rate Limiting**: Sliding-window rate limiting (60 req/min) implemented using **Redis**.
*   **Usage Tracking**: Real-time logging of status codes and latency for every forwarded request.
*   **Billing Engine**: Asynchronous background tasks managed by **Celery** to calculate tiered pricing ($0.50 per 100 requests).
*   **Real-time Dashboard**: A trademark-styled React frontend with live telemetry updates.

## 🚦 How to Simulate the Full Workflow

### 1. Initialize Infrastructure
Ensure your local PostgreSQL and Redis services are active:
```bash
sudo systemctl start postgresql redis-server


---- Start the Backend & Worker
In two separate terminals within the /backend directory:

Bash
# Terminal 1: FastAPI Server
uvicorn main:app --reload

# Terminal 2: Celery Worker
PYTHONPATH=. celery -A services.celery_worker.celery_app worker --loglevel=info


---- Start the Frontend
In the /frontend directory:

Bash
npm run dev


---- Execute the Journey
Onboard: Click "Generate API Key" on the dashboard.

Consume: Copy the key and hit the gateway via terminal:
curl -H "X-API-Key: YOUR_KEY" http://127.0.0.1:8000/posts/1

Monitor: Observe the Live Gateway Traffic table update instantly.

Bill: Trigger the background billing engine for a simulated usage:
curl -X POST "http://127.0.0.1:8000/internal/billing/run?user_id=1&total_req=1250"
