from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

SQLALCHEMY_DATABASE_URL = "postgresql+asyncpg://jira_database_1o5v_user:zcQwVJUxRej4Wevgo8pXw5H3K87wkeWV@dpg-d5uiisp4tr6s73e0bf5g-a.oregon-postgres.render.com/jira_database_1o5v"

# Create the Engine
engine = create_async_engine(SQLALCHEMY_DATABASE_URL, future=True, echo=True)

# Create the Session
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Create the Base (for models)
Base = declarative_base()

# Dependency for API routes
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
