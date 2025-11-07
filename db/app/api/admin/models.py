"""
AI Model endpoints for managing OpenRouter model metadata
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.config import get_db
from app.database.models import AIModel as AIModelModel
from app.database.schemas import AIModel, AIModelCreate, AIModelUpdate

router = APIRouter(tags=["ai-models"])


@router.get("", response_model=List[AIModel])
async def get_ai_models(
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = None,
    openrouter_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get AI models with optional filtering"""
    query = db.query(AIModelModel)
    
    if is_active is not None:
        query = query.filter(AIModelModel.is_active == is_active)
    if openrouter_id:
        query = query.filter(AIModelModel.openrouter_id == openrouter_id)
    
    models = query.offset(skip).limit(limit).all()
    return models


@router.get("/by-openrouter-id", response_model=AIModel)
async def get_ai_model_by_openrouter_id(openrouter_id: str, db: Session = Depends(get_db)):
    """Get a specific AI model by OpenRouter ID (using query parameter to handle slashes)"""
    print(f"Fetching AI model with OpenRouter ID: {openrouter_id}")
    model = db.query(AIModelModel).filter(AIModelModel.openrouter_id == openrouter_id).first()
    
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AI model with OpenRouter ID '{openrouter_id}' not found"
        )
    
    return model


@router.get("/by-identifier", response_model=AIModel)
async def get_ai_model_by_identifier(identifier: str, db: Session = Depends(get_db)):
    """Get a specific AI model by either OpenRouter ID or canonical slug (using query parameter to handle slashes)"""
    model = db.query(AIModelModel).filter(
        (AIModelModel.openrouter_id == identifier) | 
        (AIModelModel.canonical_slug == identifier)
    ).first()
    
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AI model with identifier '{identifier}' not found"
        )
    
    return model


@router.get("/search", response_model=AIModel)
async def search_ai_model(
    openrouter_id: Optional[str] = None,
    canonical_slug: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Search for a specific AI model by openrouter_id or canonical_slug"""
    if not openrouter_id and not canonical_slug:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either openrouter_id or canonical_slug must be provided"
        )
    
    query = db.query(AIModelModel)
    
    if openrouter_id and canonical_slug:
        # Search by both (OR condition)
        query = query.filter(
            (AIModelModel.openrouter_id == openrouter_id) | 
            (AIModelModel.canonical_slug == canonical_slug)
        )
    elif openrouter_id:
        query = query.filter(AIModelModel.openrouter_id == openrouter_id)
    else:
        query = query.filter(AIModelModel.canonical_slug == canonical_slug)
    
    model = query.first()
    
    if not model:
        search_criteria = []
        if openrouter_id:
            search_criteria.append(f"openrouter_id='{openrouter_id}'")
        if canonical_slug:
            search_criteria.append(f"canonical_slug='{canonical_slug}'")
        
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AI model with {' or '.join(search_criteria)} not found"
        )
    
    return model


@router.get("/{model_id}", response_model=AIModel)
async def get_ai_model(model_id: int, db: Session = Depends(get_db)):
    """Get a specific AI model by ID"""
    model = db.query(AIModelModel).filter(AIModelModel.model_id == model_id).first()
    
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AI model with id {model_id} not found"
        )
    
    return model


    return model


@router.post("", response_model=AIModel)
async def create_ai_model(model: AIModelCreate, db: Session = Depends(get_db)):
    """Create a new AI model"""
    # Check if model with same openrouter_id already exists
    existing = db.query(AIModelModel).filter(AIModelModel.openrouter_id == model.openrouter_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"AI model with OpenRouter ID '{model.openrouter_id}' already exists"
        )
    
    db_model = AIModelModel(**model.model_dump())
    db.add(db_model)
    db.commit()
    db.refresh(db_model)
    return db_model


@router.put("/{model_id}", response_model=AIModel)
async def update_ai_model(model_id: int, model_update: AIModelUpdate, db: Session = Depends(get_db)):
    """Update an AI model"""
    db_model = db.query(AIModelModel).filter(AIModelModel.model_id == model_id).first()
    
    if not db_model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AI model with id {model_id} not found"
        )
    
    # Update only provided fields
    update_data = model_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_model, field, value)
    
    db.commit()
    db.refresh(db_model)
    return db_model


@router.delete("/{model_id}")
async def delete_ai_model(model_id: int, db: Session = Depends(get_db)):
    """Delete an AI model (soft delete by setting is_active=False)"""
    db_model = db.query(AIModelModel).filter(AIModelModel.model_id == model_id).first()
    
    if not db_model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AI model with id {model_id} not found"
        )
    
    db_model.is_active = False
    db.commit()
    
    return {"message": f"AI model {model_id} deactivated"}


@router.post("/bulk-upsert")
async def bulk_upsert_ai_models(models: List[AIModelCreate], db: Session = Depends(get_db)):
    """Bulk upsert AI models (useful for syncing with OpenRouter API)"""
    created_count = 0
    updated_count = 0
    errors = []
    
    for model_data in models:
        try:
            # Check if model exists by openrouter_id OR canonical_slug
            existing = db.query(AIModelModel).filter(
                (AIModelModel.openrouter_id == model_data.openrouter_id) |
                (AIModelModel.canonical_slug == model_data.canonical_slug)
            ).first()
            
            if existing:
                # Update existing model
                update_data = model_data.model_dump()
                for field, value in update_data.items():
                    if field not in ['model_id']:  # Don't update the primary key
                        setattr(existing, field, value)
                updated_count += 1
            else:
                # Create new model
                db_model = AIModelModel(**model_data.model_dump())
                db.add(db_model)
                created_count += 1
            
            # Commit after each model to avoid constraint violations in batch
            db.commit()
                
        except Exception as e:
            db.rollback()  # Rollback the failed transaction
            errors.append({
                "openrouter_id": getattr(model_data, 'openrouter_id', 'unknown'),
                "canonical_slug": getattr(model_data, 'canonical_slug', 'unknown'),
                "error": str(e)
            })
            # Continue processing other models even if one fails
            continue
    
    return {
        "created": created_count,
        "updated": updated_count,
        "errors": errors,
        "total_processed": len(models)
    }


@router.get("/search", response_model=AIModel)
async def search_ai_model(
    openrouter_id: Optional[str] = None,
    canonical_slug: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Search for a specific AI model by openrouter_id or canonical_slug"""
    if not openrouter_id and not canonical_slug:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either openrouter_id or canonical_slug must be provided"
        )
    
    query = db.query(AIModelModel)
    
    if openrouter_id and canonical_slug:
        # Search by both (OR condition)
        query = query.filter(
            (AIModelModel.openrouter_id == openrouter_id) | 
            (AIModelModel.canonical_slug == canonical_slug)
        )
    elif openrouter_id:
        query = query.filter(AIModelModel.openrouter_id == openrouter_id)
    else:
        query = query.filter(AIModelModel.canonical_slug == canonical_slug)
    
    model = query.first()
    
    if not model:
        search_criteria = []
        if openrouter_id:
            search_criteria.append(f"openrouter_id='{openrouter_id}'")
        if canonical_slug:
            search_criteria.append(f"canonical_slug='{canonical_slug}'")
        
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AI model with {' or '.join(search_criteria)} not found"
        )
    
    return model
