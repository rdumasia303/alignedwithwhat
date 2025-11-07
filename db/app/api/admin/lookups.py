"""
Lookup table endpoints for domains, regions, personas, etc.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.config import get_db
from app.database import models
from app.database import schemas

router = APIRouter(tags=["lookups"])


# Domains
@router.get("/domains", response_model=List[schemas.Domain])
async def get_domains(db: Session = Depends(get_db)):
    """Get all domains"""
    return db.query(models.Domain).all()


@router.post("/domains", response_model=schemas.Domain)
async def create_domain(domain: schemas.DomainCreate, db: Session = Depends(get_db)):
    """Create a new domain"""
    db_domain = models.Domain(**domain.model_dump())
    db.add(db_domain)
    db.commit()
    db.refresh(db_domain)
    return db_domain


# Regions
@router.get("/regions", response_model=List[schemas.Region])
async def get_regions(db: Session = Depends(get_db)):
    """Get all regions"""
    return db.query(models.Region).all()


@router.post("/regions", response_model=schemas.Region)
async def create_region(region: schemas.RegionCreate, db: Session = Depends(get_db)):
    """Create a new region"""
    db_region = models.Region(**region.dict())
    db.add(db_region)
    db.commit()
    db.refresh(db_region)
    return db_region


# Personas
@router.get("/personas", response_model=List[schemas.Persona])
async def get_personas(db: Session = Depends(get_db)):
    """Get all personas"""
    return db.query(models.Persona).all()


@router.post("/personas", response_model=schemas.Persona)
async def create_persona(persona: schemas.PersonaCreate, db: Session = Depends(get_db)):
    """Create a new persona"""
    db_persona = models.Persona(**persona.dict())
    db.add(db_persona)
    db.commit()
    db.refresh(db_persona)
    return db_persona


# Harm Categories
@router.get("/harm-categories", response_model=List[schemas.HarmCategory])
async def get_harm_categories(db: Session = Depends(get_db)):
    """Get all harm categories"""
    return db.query(models.HarmCategory).all()


@router.post("/harm-categories", response_model=schemas.HarmCategory)
async def create_harm_category(harm_category: schemas.HarmCategoryCreate, db: Session = Depends(get_db)):
    """Create a new harm category"""
    db_harm_category = models.HarmCategory(**harm_category.dict())
    db.add(db_harm_category)
    db.commit()
    db.refresh(db_harm_category)
    return db_harm_category


# Scenario Types
@router.get("/scenario-types", response_model=List[schemas.ScenarioType])
async def get_scenario_types(db: Session = Depends(get_db)):
    """Get all scenario types"""
    return db.query(models.ScenarioType).all()


@router.post("/scenario-types", response_model=schemas.ScenarioType)
async def create_scenario_type(scenario_type: schemas.ScenarioTypeCreate, db: Session = Depends(get_db)):
    """Create a new scenario type"""
    db_scenario_type = models.ScenarioType(**scenario_type.dict())
    db.add(db_scenario_type)
    db.commit()
    db.refresh(db_scenario_type)
    return db_scenario_type


# Authority References
@router.get("/authority-refs", response_model=List[schemas.AuthorityRef])
async def get_authority_refs(db: Session = Depends(get_db)):
    """Get all authority references"""
    return db.query(models.AuthorityRef).all()


@router.post("/authority-refs", response_model=schemas.AuthorityRef)
async def create_authority_ref(authority_ref: schemas.AuthorityRefCreate, db: Session = Depends(get_db)):
    """Create a new authority reference"""
    db_authority_ref = models.AuthorityRef(**authority_ref.dict())
    db.add(db_authority_ref)
    db.commit()
    db.refresh(db_authority_ref)
    return db_authority_ref


# Power Dynamics
@router.get("/power-dynamics", response_model=List[schemas.PowerDynamic])
async def get_power_dynamics(db: Session = Depends(get_db)):
    """Get all power dynamics"""
    return db.query(models.PowerDynamic).all()


@router.post("/power-dynamics", response_model=schemas.PowerDynamic)
async def create_power_dynamic(power_dynamic: schemas.PowerDynamicCreate, db: Session = Depends(get_db)):
    """Create a new power dynamic"""
    db_power_dynamic = models.PowerDynamic(**power_dynamic.dict())
    db.add(db_power_dynamic)
    db.commit()
    db.refresh(db_power_dynamic)
    return db_power_dynamic


