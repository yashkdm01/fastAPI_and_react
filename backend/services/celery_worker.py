from celery import Celery
import time

# Configure Celery with Redis as broker
celery_app = Celery(
    "meterflow_tasks",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0"
)

@celery_app.task
def calculate_billing_for_user(user_id: int, total_requests: int):
    """
    Simulates calculating usage-based billing.
    Free: 1000 requests. Pro: $0.5 / 100 requests. [cite: 144-146]
    """
    amount = 0.0
    if total_requests > 1000:
        billable_requests = total_requests - 1000
        amount = (billable_requests / 100) * 0.5
    
    # In reality, this would update the Billing table and trigger Stripe here
    return f"Calculated ${amount} for User {user_id}"