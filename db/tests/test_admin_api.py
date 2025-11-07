"""Test admin API endpoints."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.database.models import (
    AIModel, Domain, Region, Persona, HarmCategory,
    ScenarioType, PowerDynamic
)


class TestAdminModelsAPI:
    """Test admin models API."""
    
    def test_get_models_empty(self, client: TestClient):
        """Test getting models from empty database."""
        response = client.get("/admin/models")
        assert response.status_code == 200
        data = response.json()
        assert data == []
    
    def test_get_models_with_data(self, client: TestClient, db_session: Session):
        """Test getting models with data."""
        model = AIModel(
            openrouter_id="test/model",
            canonical_slug="test-model",
            name="Test Model",
            context_length=8192,
            is_active=True
        )
        db_session.add(model)
        db_session.commit()
        
        response = client.get("/admin/models")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["openrouter_id"] == "test/model"
        assert data[0]["name"] == "Test Model"
    
    def test_get_active_models_only(self, client: TestClient, db_session: Session):
        """Test filtering active models."""
        active_model = AIModel(
            openrouter_id="test/active",
            canonical_slug="active",
            name="Active Model",
            is_active=True
        )
        inactive_model = AIModel(
            openrouter_id="test/inactive",
            canonical_slug="inactive",
            name="Inactive Model",
            is_active=False
        )
        db_session.add_all([active_model, inactive_model])
        db_session.commit()
        
        response = client.get("/admin/models?is_active=true")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["openrouter_id"] == "test/active"


class TestAdminLookupsAPI:
    """Test admin lookups API."""
    
    def test_get_domains(self, client: TestClient, db_session: Session):
        """Test getting domains."""
        domain1 = Domain(domain_name="Domain 1")
        domain2 = Domain(domain_name="Domain 2")
        db_session.add_all([domain1, domain2])
        db_session.commit()
        
        response = client.get("/admin/lookups/domains")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert any(d["domain_name"] == "Domain 1" for d in data)
    
    def test_create_domain(self, client: TestClient):
        """Test creating a domain."""
        response = client.post(
            "/admin/lookups/domains",
            json={"domain_name": "New Domain"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["domain_name"] == "New Domain"
        assert "domain_id" in data
    
    def test_get_regions(self, client: TestClient, db_session: Session):
        """Test getting regions."""
        region = Region(region_name="Test Region")
        db_session.add(region)
        db_session.commit()
        
        response = client.get("/admin/lookups/regions")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["region_name"] == "Test Region"
    
    def test_create_region(self, client: TestClient):
        """Test creating a region."""
        response = client.post(
            "/admin/lookups/regions",
            json={"region_name": "New Region"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["region_name"] == "New Region"
    
    def test_get_personas(self, client: TestClient, db_session: Session):
        """Test getting personas."""
        persona = Persona(persona_name="test_persona")
        db_session.add(persona)
        db_session.commit()
        
        response = client.get("/admin/lookups/personas")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["persona_name"] == "test_persona"
    
    def test_create_persona(self, client: TestClient):
        """Test creating a persona."""
        response = client.post(
            "/admin/lookups/personas",
            json={"persona_name": "new_persona"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["persona_name"] == "new_persona"
    
    def test_get_harm_categories(self, client: TestClient, db_session: Session):
        """Test getting harm categories."""
        harm = HarmCategory(harm_category_name="test_harm")
        db_session.add(harm)
        db_session.commit()
        
        response = client.get("/admin/lookups/harm-categories")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["harm_category_name"] == "test_harm"
    
    def test_create_harm_category(self, client: TestClient):
        """Test creating a harm category."""
        response = client.post(
            "/admin/lookups/harm-categories",
            json={"harm_category_name": "new_harm"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["harm_category_name"] == "new_harm"
    
    def test_get_scenario_types(self, client: TestClient, db_session: Session):
        """Test getting scenario types."""
        scenario_type = ScenarioType(scenario_type_name="test_type")
        db_session.add(scenario_type)
        db_session.commit()
        
        response = client.get("/admin/lookups/scenario-types")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
    
    def test_get_power_dynamics(self, client: TestClient, db_session: Session):
        """Test getting power dynamics."""
        power = PowerDynamic(power_dynamic_name="test_power")
        db_session.add(power)
        db_session.commit()
        
        response = client.get("/admin/lookups/power-dynamics")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
