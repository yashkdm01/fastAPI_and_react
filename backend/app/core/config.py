import os

class Settings:
    PROJECT_NAME: str= "Jira Clone API"
    PROJECT_VERSION: str= "1.0.0"
    DATABASE_URL = "postgresql+asyncpg://jira_db_opsd_user:y3cCcHJ3FOyqyTCsMqtbUyeo5NqUmjlx@dpg-d5ugc64r85hc73ai40p0-a/jira_db_opsd"

    # Security Settings
    SECRET_KEY = "supersecretkey123"
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 30

settings = Settings()
