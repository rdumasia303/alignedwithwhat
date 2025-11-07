"""
AlignedWithWhat Database API

A FastAPI application for managing mirror pairs, scenarios, and model responses.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

# Public API (for dashboard/external consumption)
from app.api.public import avm, analytics, mirror_pairs, health

# Admin API (for playground/system management)
from app.api.admin import setup, testing, models, lookups

# Database
from app.core.config import create_tables

# Detect if running in test mode
TESTING = os.getenv("TESTING", "false").lower() == "true"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    
    Tables are auto-created on startup.
    Data ingestion (mirror pairs, AVM protocol) is handled via /admin/setup endpoints.
    """
    # Startup - create tables if they don't exist
    create_tables()
    yield
    # Shutdown (nothing to do for now)

# Create FastAPI app
app = FastAPI(
    title="AlignedWithWhat Database API",
    description="API for managing mirror pairs, scenarios, and model responses",
    version="1.0.0",
    docs_url="/" if not TESTING else "/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers

# Public API - for dashboard and external consumption
app.include_router(avm.router, prefix="/avm")
app.include_router(analytics.router, prefix="/analytics")
app.include_router(mirror_pairs.router, prefix="/mirror-pairs")
app.include_router(health.router)

# Admin API - for playground and system management
app.include_router(setup.router)  # setup.py has full /admin/setup prefix
app.include_router(testing.router, prefix="/playground")
app.include_router(models.router, prefix="/admin/models")
app.include_router(lookups.router, prefix="/admin/lookups")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
