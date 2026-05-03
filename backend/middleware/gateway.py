import time
import httpx
import redis
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
# CORRECTED: Standardized import paths for local execution
from models.schemas import UsageLog, APIKey
from config.database import SessionLocal

# Improved Redis connection with error handling
try:
    redis_client = redis.Redis(host='localhost', port=6379, db=1, decode_responses=True)
    redis_client.ping()
except Exception:
    print("⚠️ Warning: Redis is not reachable. Rate limiting will be bypassed.")
    redis_client = None

TARGET_APIS = {
    "pokeapi": "https://pokeapi.co/api/v2", #
    "json": "https://jsonplaceholder.typicode.com" #
}

async def api_gateway_middleware(request: Request, call_next):
    # Skip gateway logic for internal dashboard and docs
    if request.url.path.startswith("/internal") or request.url.path in ["/docs", "/openapi.json"]:
        return await call_next(request)

    start_time = time.time()
    api_key_str = request.headers.get("X-API-Key")

    if not api_key_str:
        return JSONResponse(status_code=401, content={"error": "Missing API Key"}) #

    db = SessionLocal()
    try:
        # 1. Validate API Key against PostgreSQL
        key_record = db.query(APIKey).filter(APIKey.key == api_key_str, APIKey.status == "active").first()
        if not key_record:
            return JSONResponse(status_code=401, content={"error": "Invalid API Key"}) #

        # 2. Rate Limiting via Redis
        if redis_client:
            rate_limit_key = f"rate_limit:{api_key_str}"
            current_requests = redis_client.incr(rate_limit_key)
            if current_requests == 1:
                redis_client.expire(rate_limit_key, 60)
            
            if current_requests > 60:
                return JSONResponse(status_code=429, content={"error": "Rate limit exceeded. Max 60 req/min."}) #

        # 3. Forward Request to the target public API
        target_base = TARGET_APIS["json"] 
        async with httpx.AsyncClient() as client:
            target_url = f"{target_base}{request.url.path}"
            # Ensure the query parameters are passed through
            if request.query_params:
                target_url += f"?{request.query_params}"
                
            body = await request.body()
            response = await client.request(
                method=request.method,
                url=target_url,
                content=body,
                headers={"Content-Type": request.headers.get("Content-Type", "application/json")}
            )
            
            # 4. Log Request for billing and analytics
            latency = round((time.time() - start_time) * 1000, 2)
            log = UsageLog(
                api_key=api_key_str,
                endpoint=request.url.path,
                status=response.status_code,
                latency=latency
            )
            db.add(log)
            db.commit()

            return JSONResponse(status_code=response.status_code, content=response.json())
            
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"Gateway Error: {str(e)}"})
    finally:
        db.close()