class Settings:
    PROJECT_NAME: str= "Jira Clone API"
    PROJECT_VERSION: str= "1.0.0"
    RAW_DB_URL = os.environ.get("DATABASE_URL", "postgresql+asyncpg://postgres:angad@localhost/jira_database")

    # 2. Fix Render's URL format (Render uses 'postgres://' but we need 'postgresql+asyncpg://')
    if RAW_DB_URL and RAW_DB_URL.startswith("postgres://"):
        DATABASE_URL = RAW_DB_URL.replace("postgres://", "postgresql+asyncpg://", 1)
    else:
        DATABASE_URL = RAW_DB_URL
    SECRET_KEY: str = "SUPER_SECRET_PROJECT_JIRA_KEY_DO_NOT_SHARE"
    ALGORITHM: str = "HS256"
    DATABASE_URL: str = "postgresql+asyncpg://postgres:angad@127.0.0.1:5432/jira_database"

settings = Settings()
