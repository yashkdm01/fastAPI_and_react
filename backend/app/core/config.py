import os

class Settings:
    # ----------------------------------------------------------------
    # INSTRUCTIONS:
    # 1. Copy your "Internal Database URL" from the Render Dashboard.
    # 2. Paste it below inside the quotes.
    # 3. CHANGE "postgres://" to "postgresql+asyncpg://"
    # ----------------------------------------------------------------
    
    # DELETE the old localhost line. USE THIS INSTEAD:
    DATABASE_URL = "postgresql+asyncpg://user:A6X0iz2KFmuXT0tCWYj8ylE10kXL93Ps@dpg-d5t48jsoud1c7395pec0-a/jira_database_eu26"
    
    # EXAMPLE (It should look like this):
    # DATABASE_URL = "postgresql+asyncpg://user:password@dpg-cn.../jira_db"

    # Security Settings
    SECRET_KEY = "supersecretkey123"
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 30

settings = Settings()
