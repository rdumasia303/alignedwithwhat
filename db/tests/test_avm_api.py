"""
Tests for AVM Protocol API endpoints.
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database.models import AVMCategory, AVMArchetype, ScenarioType, SeverityLevel


@pytest.fixture
def test_avm_data(db_session):
    """Create test AVM framework data."""
    # Create categories
    category1 = AVMCategory(
        category_id=1,
        category_name="Compliance",
        description="Rule-following behavior"
    )
    category2 = AVMCategory(
        category_id=2,
        category_name="Engagement",
        description="User interaction style"
    )
    db_session.add_all([category1, category2])
    db_session.flush()
    
    # Create archetypes
    archetype1 = AVMArchetype(
        archetype_id=1,
        category_id=1,
        archetype_code="C1",
        archetype_name="The Compliant Assistant",
        description="Strict rule-follower",
        behavioral_signature="Never deviates from instructions",
        risk_profile="Low risk in regulated contexts",
        human_analogy="By-the-book bureaucrat",
        contextual_appropriateness="Medical, legal settings",
        ideal_scenarios="Formal documentation",
        problematic_scenarios="Creative problem-solving",
        critical_failures="Emergencies requiring judgment"
    )
    archetype2 = AVMArchetype(
        archetype_id=2,
        category_id=2,
        archetype_code="E3",
        archetype_name="The Engaging Conversationalist",
        description="Friendly and personable",
        behavioral_signature="Warm and approachable",
        risk_profile="Moderate risk in formal contexts",
        human_analogy="Friendly neighbor",
        contextual_appropriateness="Customer service, casual chat",
        ideal_scenarios="Support conversations",
        problematic_scenarios="Legal proceedings",
        critical_failures="Crisis interventions"
    )
    db_session.add_all([archetype1, archetype2])
    db_session.flush()
    
    # Create scenario types
    scenario_type = ScenarioType(
        scenario_type_id=1,
        scenario_type_name="Medical Advice",
        description="Healthcare guidance scenarios"
    )
    db_session.add(scenario_type)
    db_session.flush()
    
    # Create severity levels
    severity = SeverityLevel(
        severity_level_id=1,
        severity_level_name="High",
        description="High severity risk",
        severity_weight=3
    )
    db_session.add(severity)
    db_session.commit()
    
    return {
        'categories': [category1, category2],
        'archetypes': [archetype1, archetype2],
        'scenario_type': scenario_type,
        'severity': severity
    }


def test_get_categories_empty(client: TestClient):
    """Test categories endpoint with empty database."""
    response = client.get("/avm/categories")
    assert response.status_code == 200
    assert response.json() == []


def test_get_categories_with_data(client: TestClient, test_avm_data):
    """Test categories endpoint with data."""
    response = client.get("/avm/categories")
    assert response.status_code == 200
    
    data = response.json()
    assert len(data) == 2
    assert data[0]['category_name'] == "Compliance"
    assert data[0]['description'] == "Rule-following behavior"
    assert data[0]['archetype_count'] == 1
    assert 'created_at' in data[0]


def test_get_archetypes_empty(client: TestClient):
    """Test archetypes endpoint with empty database."""
    response = client.get("/avm/archetypes")
    assert response.status_code == 200
    assert response.json() == []


def test_get_archetypes_with_data(client: TestClient, test_avm_data):
    """Test archetypes endpoint with data."""
    response = client.get("/avm/archetypes")
    assert response.status_code == 200
    
    data = response.json()
    assert len(data) == 2
    assert data[0]['archetype_code'] == "C1"
    assert data[0]['archetype_name'] == "The Compliant Assistant"
    assert data[0]['category'] == "Compliance"
    assert data[0]['description'] == "Strict rule-follower"
    assert 'behavioral_signature' in data[0]
    assert 'human_analogy' in data[0]


def test_get_archetypes_filtered_by_category(client: TestClient, test_avm_data):
    """Test archetypes endpoint with category filter."""
    response = client.get("/avm/archetypes?category=Compliance")
    assert response.status_code == 200
    
    data = response.json()
    assert len(data) == 1
    assert data[0]['category'] == "Compliance"


def test_get_archetype_by_code(client: TestClient, test_avm_data):
    """Test get archetype by code endpoint."""
    response = client.get("/avm/archetypes/C1")
    assert response.status_code == 200
    
    data = response.json()
    assert data['archetype_code'] == "C1"
    assert data['archetype_name'] == "The Compliant Assistant"
    assert data['category']['category_name'] == "Compliance"
    assert data['category']['description'] == "Rule-following behavior"


def test_get_archetype_by_code_not_found(client: TestClient):
    """Test get archetype by code with non-existent code."""
    response = client.get("/avm/archetypes/INVALID")
    assert response.status_code == 404
    assert "not found" in response.json()['detail'].lower()


def test_get_scenario_types(client: TestClient, test_avm_data):
    """Test scenario types endpoint."""
    response = client.get("/avm/scenario-types")
    assert response.status_code == 200
    
    data = response.json()
    assert len(data) == 1
    assert data[0]['scenario_type_name'] == "Medical Advice"
    assert data[0]['description'] == "Healthcare guidance scenarios"


def test_get_severity_levels(client: TestClient, test_avm_data):
    """Test severity levels endpoint."""
    response = client.get("/avm/severity-levels")
    assert response.status_code == 200
    
    data = response.json()
    assert len(data) == 1
    assert data[0]['severity_level_name'] == "High"
    assert data[0]['severity_weight'] == 3
