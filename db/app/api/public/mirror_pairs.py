"""
Mirror Pair endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from app.core.config import get_db
from app.database.models import MirrorPair as MirrorPairModel, Prompt, Persona
from app.database.schemas import MirrorPair, MirrorPairFull

router = APIRouter(tags=["mirror-pairs"])


@router.get("", response_model=List[MirrorPair])
async def get_mirror_pairs(
    skip: int = 0,
    limit: int = 1000,
    domain_id: Optional[int] = None,
    region_id: Optional[int] = None,
    scenario_type_id: Optional[int] = None,
    weaponized_assistance: Optional[bool] = None,
    severity_level_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get mirror pairs with optional filtering (basic data only)"""
    query = db.query(MirrorPairModel)
    
    if domain_id:
        query = query.filter(MirrorPairModel.domain_id == domain_id)
    if region_id:
        query = query.filter(MirrorPairModel.region_id == region_id)
    if scenario_type_id:
        query = query.filter(MirrorPairModel.scenario_type_id == scenario_type_id)
    if weaponized_assistance is not None:
        query = query.filter(MirrorPairModel.weaponized_assistance == weaponized_assistance)
    if severity_level_id:
        query = query.filter(MirrorPairModel.severity_level_id == severity_level_id)
    
    mirror_pairs = query.offset(skip).limit(limit).all()
    return mirror_pairs


@router.get("/full", response_model=List[MirrorPairFull])
async def get_mirror_pairs_full(
    skip: int = 0,
    limit: int = 1000,
    domain_id: Optional[int] = None,
    region_id: Optional[int] = None,
    scenario_type_id: Optional[int] = None,
    weaponized_assistance: Optional[bool] = None,
    severity_level_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get mirror pairs with all related data (full nested objects)"""
    query = db.query(MirrorPairModel).options(
        joinedload(MirrorPairModel.domain),
        joinedload(MirrorPairModel.region),
        joinedload(MirrorPairModel.scenario_type_ref),
        joinedload(MirrorPairModel.power_dynamic_ref),
        joinedload(MirrorPairModel.severity_level_ref),
        joinedload(MirrorPairModel.prompts).joinedload(Prompt.persona),
        joinedload(MirrorPairModel.harm_categories),
        joinedload(MirrorPairModel.authority_refs)
    )
    
    if domain_id:
        query = query.filter(MirrorPairModel.domain_id == domain_id)
    if region_id:
        query = query.filter(MirrorPairModel.region_id == region_id)
    if scenario_type_id:
        query = query.filter(MirrorPairModel.scenario_type_id == scenario_type_id)
    if weaponized_assistance is not None:
        query = query.filter(MirrorPairModel.weaponized_assistance == weaponized_assistance)
    if severity_level_id:
        query = query.filter(MirrorPairModel.severity_level_id == severity_level_id)
    
    mirror_pairs = query.offset(skip).limit(limit).all()
    return mirror_pairs


@router.get("/{pair_id}", response_model=MirrorPair)
async def get_mirror_pair(pair_id: str, db: Session = Depends(get_db)):
    """Get a specific mirror pair (basic data only)"""
    mirror_pair = db.query(MirrorPairModel).filter(MirrorPairModel.pair_id == pair_id).first()
    
    if not mirror_pair:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mirror pair with id {pair_id} not found"
        )
    
    return mirror_pair


@router.get("/{pair_id}/full", response_model=MirrorPairFull)
async def get_mirror_pair_full(pair_id: str, db: Session = Depends(get_db)):
    """Get a specific mirror pair with all related data"""
    mirror_pair = db.query(MirrorPairModel).options(
        joinedload(MirrorPairModel.domain),
        joinedload(MirrorPairModel.region),
        joinedload(MirrorPairModel.scenario_type_ref),
        joinedload(MirrorPairModel.power_dynamic_ref),
        joinedload(MirrorPairModel.severity_level_ref),
        joinedload(MirrorPairModel.prompts).joinedload(Prompt.persona),
        joinedload(MirrorPairModel.harm_categories),
        joinedload(MirrorPairModel.authority_refs)
    ).filter(MirrorPairModel.pair_id == pair_id).first()
    
    if not mirror_pair:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mirror pair with id {pair_id} not found"
        )
    
    return mirror_pair


@router.get("/analytics/severity", response_model=dict)
async def get_severity_analytics(db: Session = Depends(get_db)):
    """Get analytics on severity levels and weaponized assistance"""
    from sqlalchemy import func
    from app.database.models import SeverityLevel
    
    # Get severity level distribution
    severity_stats = db.query(
        SeverityLevel.severity_level_name,
        SeverityLevel.severity_weight,
        func.count(MirrorPairModel.pair_id).label('count')
    ).join(
        MirrorPairModel, SeverityLevel.severity_level_id == MirrorPairModel.severity_level_id, isouter=True
    ).group_by(
        SeverityLevel.severity_level_id,
        SeverityLevel.severity_level_name,
        SeverityLevel.severity_weight
    ).order_by(SeverityLevel.severity_weight).all()
    
    # Get weaponized assistance distribution
    weaponized_stats = db.query(
        MirrorPairModel.weaponized_assistance,
        func.count(MirrorPairModel.pair_id).label('count')
    ).group_by(MirrorPairModel.weaponized_assistance).all()
    
    return {
        "severity_distribution": [
            {
                "level": stat.severity_level_name,
                "weight": stat.severity_weight,
                "count": stat.count
            } for stat in severity_stats
        ],
        "weaponized_assistance_distribution": [
            {
                "weaponized": bool(stat.weaponized_assistance) if stat.weaponized_assistance is not None else None,
                "count": stat.count
            } for stat in weaponized_stats
        ]
    }


@router.post("/migrate-data")
async def migrate_existing_data(db: Session = Depends(get_db)):
    """
    Migrate existing mirror_pairs data with the new fields from patch_data.json.
    This endpoint reads the patch data and updates existing database records.
    """
    import json
    from pathlib import Path
    from app.database.models import SeverityLevel
    
    # Load patch data
    patch_file = Path("/app/patch_data.json")
    if not patch_file.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patch data file not found"
        )
    
    with open(patch_file, 'r') as f:
        patch_data = json.load(f)
    
    # Convert to lookup dict
    patch_lookup = {item['id']: item for item in patch_data}
    
    # Create severity levels if they don't exist
    severity_levels = {}
    for item in patch_data:
        severity_name = item['severity']
        if severity_name not in severity_levels:
            existing_level = db.query(SeverityLevel).filter(
                SeverityLevel.severity_level_name == severity_name
            ).first()
            
            if not existing_level:
                # Create new severity level
                weight_map = {'low': 1, 'moderate': 2, 'high': 3, 'critical': 4}
                new_level = SeverityLevel(
                    severity_level_name=severity_name,
                    severity_weight=weight_map.get(severity_name, 2)
                )
                db.add(new_level)
                db.flush()  # Get the ID
                severity_levels[severity_name] = new_level.severity_level_id
            else:
                severity_levels[severity_name] = existing_level.severity_level_id
    
    # Update mirror pairs
    updated_count = 0
    for mirror_pair in db.query(MirrorPairModel).all():
        if mirror_pair.pair_id in patch_lookup:
            patch_info = patch_lookup[mirror_pair.pair_id]
            
            # Update weaponized_assistance
            mirror_pair.weaponized_assistance = patch_info['weaponized_assistance']
            
            # Update severity_level_id
            severity_name = patch_info['severity']
            mirror_pair.severity_level_id = severity_levels[severity_name]
            
            updated_count += 1
    
    db.commit()
    
    return {
        "message": f"Successfully migrated {updated_count} mirror pairs",
        "updated_count": updated_count,
        "total_patch_items": len(patch_data)
    }
