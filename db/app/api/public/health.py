"""
Health check and system status endpoints
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.config import get_db

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "alignedwithwhat-db"}


@router.get("/stats/overview")
async def get_stats_overview(db: Session = Depends(get_db)):
    """Get database statistics overview"""
    try:
        # Get counts for each table
        stats = {}
        
        tables = ["prompts", "mirror_pairs", "model_responses", "personas"]
        for table in tables:
            result = db.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
            stats[table] = result
            
        return {
            "database": "alignedwithwhat",
            "status": "connected",
            "statistics": stats
        }
    except Exception as e:
        return {
            "database": "alignedwithwhat", 
            "status": "error",
            "error": str(e)
        }
