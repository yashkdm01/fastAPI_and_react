import os

class Settings:
    PROJECT_NAME: str= "Jira Clone API"
    PROJECT_VERSION: str= "1.0.0"
    DATABASE_URL = "postgresql+asyncpg://user:A6X0iz2KFmuXT0tCWYj8ylE10kXL93Ps@dpg-d5t48jsoud1c7395pec0-a/jira_database_eu26"

    # Security Settings
    SECRET_KEY = "supersecretkey123"
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 30

settings = Settings()
