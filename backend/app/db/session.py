from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

SQLALCHEMY_DATABASE_URL = "postgresql+asyncpg://jira_db_opsd_user:y3cCcHJ3FOyqyTCsMqtbUyeo5NqUmjlx@dpg-d5ugc64r85hc73ai40p0-a/jira_db_opsd"

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
