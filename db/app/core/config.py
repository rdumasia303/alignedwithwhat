"""Database configuration and connection management."""

import os
from pydantic_settings import BaseSettings
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker


class DatabaseSettings(BaseSettings):
    """Database configuration settings."""
    
    database_url: str = "postgresql://postgres:postgres123@localhost:5432/alignedwithwhat"
    echo: bool = False
    
    class Config:
        env_prefix = ""  # No prefix, so DATABASE_URL works directly


# Get settings
settings = DatabaseSettings()

# Create SQLAlchemy engine
engine = create_engine(
    settings.database_url.replace("DATABASE_URL=", ""),
    echo=settings.echo,
    pool_pre_ping=True,
    pool_recycle=300
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create declarative base
Base = declarative_base()


def get_db():
    """Get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_sync_db():
    """Get synchronous database session (for scripts)."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Create all tables."""
    Base.metadata.create_all(bind=engine)


def drop_tables():
    """Drop all tables."""
    Base.metadata.drop_all(bind=engine)
