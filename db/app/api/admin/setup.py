"""
Admin Setup Endpoints

Data ingestion for mirror pairs and AVM protocol.
All ingestion logic is inline - no separate service layer.

Note: Database tables are auto-created on application startup.
This module handles DATA ingestion only (YAML/JSON uploads).
"""

import yaml
import json
from pathlib import Path
from typing import Dict, Any
import logging

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.config import get_db
from app.database.models import (
    MirrorPair, Prompt, AVMCategory, AVMArchetype,
    ScenarioType, SeverityLevel, Domain, Region, Persona,
    HarmCategory, AuthorityRef, PowerDynamic, AIModel, ExecutionRun
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin/setup", tags=["admin-setup"])


# ========== MIRROR PAIRS INGESTION ==========

def get_or_create_domain(db: Session, name: str) -> Domain:
    """Get or create domain."""
    if not name:
        return None
    domain = db.query(Domain).filter(Domain.domain_name == name).first()
    if not domain:
        domain = Domain(domain_name=name)
        db.add(domain)
        db.flush()
    return domain


def get_or_create_region(db: Session, name: str) -> Region:
    """Get or create region."""
    if not name:
        return None
    region = db.query(Region).filter(Region.region_name == name).first()
    if not region:
        region = Region(region_name=name)
        db.add(region)
        db.flush()
    return region


def get_or_create_persona(db: Session, name: str) -> Persona:
    """Get or create persona."""
    if not name:
        return None
    persona = db.query(Persona).filter(Persona.persona_name == name).first()
    if not persona:
        persona = Persona(persona_name=name)
        db.add(persona)
        db.flush()
    return persona


def get_or_create_harm_category(db: Session, name: str) -> HarmCategory:
    """Get or create harm category."""
    if not name:
        return None
    category = db.query(HarmCategory).filter(HarmCategory.harm_category_name == name).first()
    if not category:
        category = HarmCategory(harm_category_name=name)
        db.add(category)
        db.flush()
    return category


def get_or_create_authority_ref(db: Session, text: str) -> AuthorityRef:
    """Get or create authority reference."""
    if not text:
        return None
    auth_ref = db.query(AuthorityRef).filter(AuthorityRef.authority_ref_text == text).first()
    if not auth_ref:
        auth_ref = AuthorityRef(authority_ref_text=text)
        db.add(auth_ref)
        db.flush()
    return auth_ref


def get_or_create_severity_level(db: Session, name: str) -> SeverityLevel:
    """Get or create severity level."""
    if not name:
        return None
    severity = db.query(SeverityLevel).filter(SeverityLevel.severity_level_name == name).first()
    if not severity:
        # Map severity names to weights
        weight_map = {
            'trivial': 1,
            'low': 2,
            'moderate': 3,
            'high': 4,
            'critical': 5
        }
        weight = weight_map.get(name.lower(), 3)
        severity = SeverityLevel(
            severity_level_name=name,
            severity_weight=weight
        )
        db.add(severity)
        db.flush()
    return severity


def get_or_create_scenario_type(db: Session, name: str) -> ScenarioType:
    """Get or create scenario type."""
    if not name:
        return None
    scenario = db.query(ScenarioType).filter(ScenarioType.scenario_type_name == name).first()
    if not scenario:
        scenario = ScenarioType(scenario_type_name=name)
        db.add(scenario)
        db.flush()
    return scenario


def get_or_create_power_dynamic(db: Session, name: str) -> PowerDynamic:
    """Get or create power dynamic."""
    if not name:
        return None
    power = db.query(PowerDynamic).filter(PowerDynamic.power_dynamic_name == name).first()
    if not power:
        power = PowerDynamic(power_dynamic_name=name)
        db.add(power)
        db.flush()
    return power


def ingest_mirror_pair(db: Session, mp_data: Dict[str, Any]) -> Dict[str, Any]:
    """Ingest a single mirror pair."""
    pair_id = mp_data.get("id")
    if not pair_id:
        return {"success": False, "error": "Missing ID"}
    
    # Check if exists
    existing = db.query(MirrorPair).filter(MirrorPair.pair_id == pair_id).first()
    if existing:
        return {"success": False, "mirror_pair_id": pair_id, "error": "Already exists"}
    
    # Get/create foreign keys
    domain = get_or_create_domain(db, mp_data.get("domain"))
    region = get_or_create_region(db, mp_data.get("region"))
    persona_a = get_or_create_persona(db, mp_data.get("persona_a"))
    persona_b = get_or_create_persona(db, mp_data.get("persona_b"))
    scenario_type = get_or_create_scenario_type(db, mp_data.get("scenario_type"))
    power_dynamic = get_or_create_power_dynamic(db, mp_data.get("power_dynamic"))
    severity_level = get_or_create_severity_level(db, mp_data.get("severity"))
    
    # Create mirror pair
    mirror_pair = MirrorPair(
        pair_id=pair_id,
        domain_id=domain.domain_id if domain else None,
        region_id=region.region_id if region else None,
        scenario_type_id=scenario_type.scenario_type_id if scenario_type else None,
        power_dynamic_id=power_dynamic.power_dynamic_id if power_dynamic else None,
        severity_level_id=severity_level.severity_level_id if severity_level else None,
        conflict_text=mp_data.get("conflict", ""),
        weaponized_assistance=mp_data.get("weaponized_assistance", False),
        full_description=mp_data.get("full_description")
    )
    db.add(mirror_pair)
    db.flush()
    
    # Handle harm_categories (many-to-many)
    harm_category_names = mp_data.get("harm_categories", [])
    if harm_category_names:
        for category_name in harm_category_names:
            harm_category = get_or_create_harm_category(db, category_name)
            if harm_category and harm_category not in mirror_pair.harm_categories:
                mirror_pair.harm_categories.append(harm_category)
    
    # Handle authority_refs (many-to-many)
    authority_ref_texts = mp_data.get("authority_refs", [])
    if authority_ref_texts:
        for ref_text in authority_ref_texts:
            authority_ref = get_or_create_authority_ref(db, ref_text)
            if authority_ref and authority_ref not in mirror_pair.authority_refs:
                mirror_pair.authority_refs.append(authority_ref)
    
    # Create prompts
    for prompt_type in ['A', 'B']:
        prompt_key = f"prompt_{prompt_type.lower()}"
        persona_key = f"persona_{prompt_type.lower()}"
        if prompt_key in mp_data and persona_key in mp_data:
            persona = persona_a if prompt_type == 'A' else persona_b
            if persona:
                prompt = Prompt(
                    pair_id=pair_id,
                    prompt_type=prompt_type,
                    prompt_text=mp_data[prompt_key],
                    persona_id=persona.persona_id
                )
                db.add(prompt)
    
    db.commit()
    return {"success": True, "mirror_pair_id": pair_id}


@router.post("/ingest/mirror-pairs")
async def ingest_mirror_pairs_yaml(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload and ingest mirror pairs from YAML file.
    
    Expected YAML structure:
    ```yaml
    - mirror_pair:
        id: "MP-001"
        domain: "Domain Name"
        region: "Region"
        persona_a: "Persona A"
        persona_b: "Persona B"
        scenario_type: "clear_cut"
        power_dynamic: "asymmetric"
        conflict: "Description"
        prompt_a: "First prompt"
        prompt_b: "Second prompt"
    ```
    """
    if not file.filename.endswith(('.yaml', '.yml')):
        raise HTTPException(status_code=400, detail="File must be YAML")
    
    try:
        content = await file.read()
        yaml_data = yaml.safe_load(content.decode('utf-8'))
        
        if not isinstance(yaml_data, list):
            raise HTTPException(status_code=400, detail="YAML must be a list")
        
        ingested = 0
        skipped = 0
        details = []
        
        for item in yaml_data:
            if "mirror_pair" not in item:
                skipped += 1
                continue
            
            result = ingest_mirror_pair(db, item["mirror_pair"])
            if result["success"]:
                ingested += 1
            else:
                skipped += 1
            details.append(result)
        
        # Count total prompts created
        prompts_created = db.query(Prompt).count()
        
        return {
            "success": True,
            "pairs_created": ingested,
            "prompts_created": prompts_created,
            "skipped_count": skipped,
            "details": details,
            "message": f"Ingested {ingested} mirror pairs with {prompts_created} prompts, skipped {skipped}"
        }
        
    except Exception as e:
        logger.error(f"Ingestion failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/mirror-pairs")
async def get_mirror_pair_status(db: Session = Depends(get_db)):
    """Check mirror pair ingestion status."""
    count = db.query(MirrorPair).count()
    prompt_count = db.query(Prompt).count()
    
    sample_pairs = db.query(MirrorPair).limit(5).all()
    
    return {
        "total_mirror_pairs": count,
        "total_prompts": prompt_count,
        "sample_pair_ids": [p.pair_id for p in sample_pairs],
        "ready": count > 0
    }


@router.delete("/reset/mirror-pairs")
async def reset_mirror_pairs(confirm: str, db: Session = Depends(get_db)):
    """⚠️ Delete all mirror pairs. Requires confirmation='YES_DELETE'"""
    if confirm != "YES_DELETE":
        raise HTTPException(status_code=400, detail="Confirmation required")
    
    db.query(Prompt).delete()
    db.query(MirrorPair).delete()
    db.commit()
    
    return {"success": True, "message": "All mirror pairs deleted"}


# ========== AVM PROTOCOL INGESTION ==========

def ingest_avm_category(db: Session, cat_data: Dict[str, Any]) -> AVMCategory:
    """Ingest AVM category with archetypes."""
    category_name = cat_data.get("category_name")
    
    existing = db.query(AVMCategory).filter(
        AVMCategory.category_name == category_name
    ).first()
    
    if existing:
        return existing
    
    category = AVMCategory(
        category_name=category_name,
        description=cat_data.get("description", "")
    )
    db.add(category)
    db.flush()
    
    # Ingest archetypes
    for arch_data in cat_data.get("archetypes", []):
        archetype = AVMArchetype(
            category_id=category.category_id,
            archetype_code=arch_data.get("archetype_code"),
            archetype_name=arch_data.get("archetype_name"),
            description=arch_data.get("description", ""),
            behavioral_signature=arch_data.get("behavioral_signature", ""),
            risk_profile=arch_data.get("risk_profile", ""),
            trigger_conditions=arch_data.get("trigger_conditions", ""),
            human_analogy=arch_data.get("human_analogy", ""),
            research_notes=arch_data.get("research_notes", ""),
            contextual_appropriateness=arch_data.get("contextual_appropriateness"),
            severity_sensitivity=arch_data.get("severity_sensitivity", ""),
            ideal_scenarios=arch_data.get("ideal_scenarios"),
            problematic_scenarios=arch_data.get("problematic_scenarios"),
            critical_failures=arch_data.get("critical_failures")
        )
        db.add(archetype)
    
    return category


@router.post("/ingest/avm-protocol")
async def ingest_avm_protocol_json(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload and ingest AVM Protocol from JSON file.
    
    Expected JSON structure:
    ```json
    {
      "archetype_taxonomy": {
        "CODE": {
          "name": "Archetype Name",
          "category": "Category Name",
          "description": "...",
          ...
        }
      },
      "category_summaries": {
        "Category Name": "Description"
      }
    }
    ```
    """
    if not file.filename.endswith('.json'):
        raise HTTPException(status_code=400, detail="File must be JSON")
    
    try:
        content = await file.read()
        json_data = json.loads(content.decode('utf-8'))
        
        # Get category summaries and archetype taxonomy
        category_summaries = json_data.get("category_summaries", {})
        archetype_taxonomy = json_data.get("archetype_taxonomy", {})
        
        # Group archetypes by category
        categories_map = {}
        for archetype_code, arch_data in archetype_taxonomy.items():
            category_name = arch_data.get("category")
            if category_name not in categories_map:
                categories_map[category_name] = {
                    "category_name": category_name,
                    "description": category_summaries.get(category_name, ""),
                    "archetypes": []
                }
            
            categories_map[category_name]["archetypes"].append({
                "archetype_code": archetype_code,
                "archetype_name": arch_data.get("name"),
                "description": arch_data.get("description", ""),
                "behavioral_signature": arch_data.get("behavioral_signature", ""),
                "risk_profile": arch_data.get("risk_profile", ""),
                "trigger_conditions": arch_data.get("trigger_conditions", ""),
                "human_analogy": arch_data.get("human_analogy", ""),
                "research_notes": arch_data.get("research_notes", ""),
                "contextual_appropriateness": arch_data.get("contextual_appropriateness"),
                "severity_sensitivity": arch_data.get("severity_sensitivity", ""),
                "ideal_scenarios": arch_data.get("ideal_scenarios"),
                "problematic_scenarios": arch_data.get("problematic_scenarios"),
                "critical_failures": arch_data.get("critical_failures")
            })
        
        ingested_categories = 0
        ingested_archetypes = 0
        
        for cat_data in categories_map.values():
            category = ingest_avm_category(db, cat_data)
            ingested_categories += 1
            ingested_archetypes += len(cat_data.get("archetypes", []))
        
        db.commit()
        
        return {
            "success": True,
            "categories_created": ingested_categories,
            "archetypes_created": ingested_archetypes,
            "message": f"Ingested {ingested_categories} categories with {ingested_archetypes} archetypes"
        }
        
    except Exception as e:
        logger.error(f"AVM ingestion failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/avm-protocol")
async def get_avm_protocol_status(db: Session = Depends(get_db)):
    """Check AVM Protocol ingestion status."""
    category_count = db.query(AVMCategory).count()
    archetype_count = db.query(AVMArchetype).count()
    
    return {
        "total_categories": category_count,
        "total_archetypes": archetype_count,
        "ready": category_count > 0
    }


@router.delete("/reset/avm-protocol")
async def reset_avm_protocol(confirm: str, db: Session = Depends(get_db)):
    """⚠️ Delete all AVM data. Requires confirmation='YES_DELETE'"""
    if confirm != "YES_DELETE":
        raise HTTPException(status_code=400, detail="Confirmation required")
    
    db.query(AVMArchetype).delete()
    db.query(AVMCategory).delete()
    db.commit()
    
    return {"success": True, "message": "AVM Protocol data deleted"}


# ========== SYSTEM STATUS ==========

@router.get("/status/system")
async def get_system_status(db: Session = Depends(get_db)):
    """Get overall system setup status."""
    mirror_pairs_count = db.query(MirrorPair).count()
    prompts_count = db.query(Prompt).count()
    avm_categories_count = db.query(AVMCategory).count()
    avm_archetypes_count = db.query(AVMArchetype).count()
    ai_models_count = db.query(AIModel).count()
    execution_runs_count = db.query(ExecutionRun).count()
    
    return {
        "database_status": "connected",
        "mirror_pairs_count": mirror_pairs_count,
        "prompts_count": prompts_count,
        "avm_categories_count": avm_categories_count,
        "avm_archetypes_count": avm_archetypes_count,
        "ai_models_count": ai_models_count,
        "execution_runs_count": execution_runs_count,
        "is_initialized": mirror_pairs_count > 0 and avm_categories_count > 0
    }
