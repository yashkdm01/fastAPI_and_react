from logging.config import fileConfig
###
import asyncio
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config
###
from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

from app.db.base import Base
from app.db.models import User, Project, Ticket

models = [User, Project, Ticket]
config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)
target_metadata = Base.metadata
print(f"DEBUG: Found tables in metadata: {target_metadata.tables.keys()}")



def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


import asyncio
from sqlalchemy.ext.asyncio import create_async_engine

def run_migrations_online() -> None:
    connectable = create_async_engine(config.get_main_option("sqlalchemy.url"))

    async def do_run_migrations():
        async with connectable.connect() as connection:
            await connection.run_sync(do_run_migrations_sync)

    def do_run_migrations_sync(connection):
        context.configure(
            connection=connection, 
            target_metadata=target_metadata
        )
        with context.begin_transaction():
            context.run_migrations()

    asyncio.run(do_run_migrations())