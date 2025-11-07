"""Test health and statistics endpoints."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.database.models import (
    MirrorPair, Domain, Region, ScenarioType, Persona,
    Prompt, AIModel, ModelResponse, ExecutionRun
)


class TestHealthEndpoint:
    """Test health check endpoint."""
    
    def test_health_check(self, client: TestClient):
        """Test basic health check."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "service" in data
    
    def test_stats_endpoint_empty(self, client: TestClient):
        """Test stats endpoint with empty database."""
        response = client.get("/stats/overview")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "connected"
        assert "statistics" in data
        stats = data["statistics"]
        assert stats["mirror_pairs"] == 0
        assert stats["prompts"] == 0
    
    def test_stats_endpoint_with_data(self, client: TestClient, db_session: Session):
        """Test stats endpoint with data."""
        # Create test data
        domain = Domain(domain_name="Test")
        region = Region(region_name="Test")
        scenario_type = ScenarioType(scenario_type_name="test")
        persona = Persona(persona_name="test")
        
        db_session.add_all([domain, region, scenario_type, persona])
        db_session.flush()
        
        # Create mirror pair
        mirror_pair = MirrorPair(
            pair_id="MP-Test-01",
            domain_id=domain.domain_id,
            region_id=region.region_id,
            scenario_type_id=scenario_type.scenario_type_id,
            conflict_text="Test conflict"
        )
        db_session.add(mirror_pair)
        db_session.flush()
        
        # Create prompts
        prompt_a = Prompt(
            pair_id="MP-Test-01",
            persona_id=persona.persona_id,
            prompt_type="A",
            prompt_text="Test prompt A"
        )
        prompt_b = Prompt(
            pair_id="MP-Test-01",
            persona_id=persona.persona_id,
            prompt_type="B",
            prompt_text="Test prompt B"
        )
        db_session.add_all([prompt_a, prompt_b])
        db_session.flush()
        
        # Create AI model
        model = AIModel(
            openrouter_id="test/model",
            canonical_slug="test-model",
            name="Test Model"
        )
        db_session.add(model)
        db_session.flush()
        
        # Create execution run
        run = ExecutionRun(
            run_name="Test Run",
            status="completed"
        )
        db_session.add(run)
        db_session.flush()
        
        # Create responses
        response_a = ModelResponse(
            prompt_id=prompt_a.prompt_id,
            ai_model_id=model.model_id,
            execution_run_id=run.run_id,
            output_text="Response A",
            success=True
        )
        response_b = ModelResponse(
            prompt_id=prompt_b.prompt_id,
            ai_model_id=model.model_id,
            execution_run_id=run.run_id,
            output_text="Response B",
            success=True
        )
        db_session.add_all([response_a, response_b])
        db_session.commit()
        
        # Test stats
        response = client.get("/stats/overview")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "connected"
        stats = data["statistics"]
        assert stats["mirror_pairs"] == 1
        assert stats["prompts"] == 2
        assert stats["model_responses"] == 2
