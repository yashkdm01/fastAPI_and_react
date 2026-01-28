class Settings:
    PROJECT_NAME: str= "Jira Clone API"
    PROJECT_VERSION: str= "1.0.0"
    SECRET_KEY: str = "SUPER_SECRET_PROJECT_JIRA_KEY_DO_NOT_SHARE"
    ALGORITHM: str = "HS256"
    DATABASE_URL: str = "postgresql+asyncpg://postgres:angad@127.0.0.1:5432/jira_database"

settings = Settings()
