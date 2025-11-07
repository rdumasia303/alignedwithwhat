"""Test mirror pairs API endpoints."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.database.models import (
    MirrorPair, Domain, Region, ScenarioType, Persona,
    Prompt, HarmCategory, PowerDynamic
)


class TestMirrorPairsAPI:
    """Test mirror pairs public API."""
    
    def test_get_mirror_pairs_empty(self, client: TestClient):
        """Test getting mirror pairs from empty database."""
        response = client.get("/mirror-pairs")
        assert response.status_code == 200
        data = response.json()
        assert data == []
    
    def test_get_mirror_pairs_with_data(self, client: TestClient, db_session: Session):
        """Test getting mirror pairs with data."""
        # Create dependencies
        domain = Domain(domain_name="Test Domain")
        region = Region(region_name="Test Region")
        scenario_type = ScenarioType(scenario_type_name="test_type")
        
        db_session.add_all([domain, region, scenario_type])
        db_session.flush()
        
        # Create mirror pair
        mirror_pair = MirrorPair(
            pair_id="MP-Test-01",
            domain_id=domain.domain_id,
            region_id=region.region_id,
            scenario_type_id=scenario_type.scenario_type_id,
            conflict_text="Test conflict description"
        )
        db_session.add(mirror_pair)
        db_session.commit()
        
        # Get mirror pairs
        response = client.get("/mirror-pairs")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["pair_id"] == "MP-Test-01"
        assert data[0]["conflict_text"] == "Test conflict description"
    
    def test_get_mirror_pair_by_id(self, client: TestClient, db_session: Session):
        """Test getting specific mirror pair by ID."""
        # Create dependencies
        domain = Domain(domain_name="Test Domain")
        region = Region(region_name="Test Region")
        scenario_type = ScenarioType(scenario_type_name="test_type")
        persona = Persona(persona_name="test_persona")
        
        db_session.add_all([domain, region, scenario_type, persona])
        db_session.flush()
        
        # Create mirror pair with prompts
        mirror_pair = MirrorPair(
            pair_id="MP-Test-01",
            domain_id=domain.domain_id,
            region_id=region.region_id,
            scenario_type_id=scenario_type.scenario_type_id,
            conflict_text="Test conflict"
        )
        db_session.add(mirror_pair)
        db_session.flush()
        
        # Add prompts
        prompt_a = Prompt(
            pair_id="MP-Test-01",
            persona_id=persona.persona_id,
            prompt_type="A",
            prompt_text="Prompt A text"
        )
        prompt_b = Prompt(
            pair_id="MP-Test-01",
            persona_id=persona.persona_id,
            prompt_type="B",
            prompt_text="Prompt B text"
        )
        db_session.add_all([prompt_a, prompt_b])
        db_session.commit()
        
        # Get specific mirror pair with full data
        response = client.get("/mirror-pairs/MP-Test-01/full")
        assert response.status_code == 200
        data = response.json()
        assert data["pair_id"] == "MP-Test-01"
        assert data["conflict_text"] == "Test conflict"
        assert len(data["prompts"]) == 2
    
    def test_get_mirror_pair_not_found(self, client: TestClient):
        """Test getting non-existent mirror pair."""
        response = client.get("/mirror-pairs/MP-NonExistent")
        assert response.status_code == 404
    
    def test_get_mirror_pairs_with_pagination(self, client: TestClient, db_session: Session):
        """Test mirror pairs pagination."""
        # Create dependencies
        domain = Domain(domain_name="Test Domain")
        region = Region(region_name="Test Region")
        scenario_type = ScenarioType(scenario_type_name="test_type")
        
        db_session.add_all([domain, region, scenario_type])
        db_session.flush()
        
        # Create multiple mirror pairs
        for i in range(5):
            mirror_pair = MirrorPair(
                pair_id=f"MP-Test-{i:02d}",
                domain_id=domain.domain_id,
                region_id=region.region_id,
                scenario_type_id=scenario_type.scenario_type_id,
                conflict_text=f"Test conflict {i}"
            )
            db_session.add(mirror_pair)
        db_session.commit()
        
        # Test pagination
        response = client.get("/mirror-pairs?skip=0&limit=3")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        
        response = client.get("/mirror-pairs?skip=3&limit=3")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
