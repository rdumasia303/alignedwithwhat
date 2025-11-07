"""
Tests for analytics API endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from datetime import datetime

from app.main import app
from app.database.models import (
    AIModel, MirrorPair, Prompt, ModelResponse, ExecutionRun, 
    Persona, Domain, Region, HarmCategory, ScenarioType
)


@pytest.fixture
def test_data(db_session):
    """Create test data for analytics endpoints."""
    # Create lookup data
    domain = Domain(
        domain_id=1,
        domain_name="Healthcare"
    )
    region = Region(
        region_id=1,
        region_name="US-Northeast"
    )
    scenario_type = ScenarioType(
        scenario_type_id=1,
        scenario_type_name="Medical"
    )
    persona = Persona(
        persona_id=1,
        persona_name="Doctor"
    )
    harm_category = HarmCategory(
        harm_category_id=1,
        harm_category_name="Privacy"
    )
    
    db_session.add_all([domain, region, scenario_type, persona, harm_category])
    db_session.flush()
    
    # Create AI model
    ai_model = AIModel(
        model_id=1,
        openrouter_id="openai/gpt-4",
        canonical_slug="gpt-4",
        name="GPT-4"
    )
    db_session.add(ai_model)
    db_session.flush()
    
    # Create mirror pair
    mirror_pair = MirrorPair(
        pair_id="test-pair-1",
        domain_id=1,
        region_id=1,
        scenario_type_id=1,
        conflict_text="Test medical scenario conflict"
    )
    mirror_pair.harm_categories.append(harm_category)
    
    db_session.add(mirror_pair)
    db_session.flush()
    
    # Create prompts
    prompt_a = Prompt(
        prompt_id=1,
        pair_id="test-pair-1",
        persona_id=1,
        prompt_type='A',
        prompt_text="Prompt A text"
    )
    prompt_b = Prompt(
        prompt_id=2,
        pair_id="test-pair-1",
        persona_id=1,
        prompt_type='B',
        prompt_text="Prompt B text"
    )
    db_session.add_all([prompt_a, prompt_b])
    db_session.flush()
    
    # Create execution run
    execution_run = ExecutionRun(
        run_id=1,
        run_name="Test run",
        status="completed"
    )
    db_session.add(execution_run)
    db_session.flush()
    
    # Create responses
    response_a = ModelResponse(
        response_id=1,
        prompt_id=1,
        ai_model_id=1,
        execution_run_id=1,
        output_text="Response A",
        execution_timestamp=datetime.utcnow(),
        success=True,
        total_tokens=100,
        duration_ms=500
    )
    response_b = ModelResponse(
        response_id=2,
        prompt_id=2,
        ai_model_id=1,
        execution_run_id=1,
        output_text="Response B",
        execution_timestamp=datetime.utcnow(),
        success=True,
        total_tokens=120,
        duration_ms=550
    )
    db_session.add_all([response_a, response_b])
    db_session.commit()
    
    return {
        'ai_model': ai_model,
        'mirror_pair': mirror_pair,
        'prompts': [prompt_a, prompt_b],
        'responses': [response_a, response_b],
        'execution_run': execution_run
    }


def test_get_compound_test_result(client: TestClient, test_data):
    """Test compound test result endpoint."""
    pair_id = test_data['mirror_pair'].pair_id
    
    response = client.get(f"/analytics/compound-test-result/{pair_id}")
    assert response.status_code == 200
    
    data = response.json()
    assert data['pair_id'] == pair_id
    assert data['prompt_a_text'] == "Prompt A text"
    assert data['prompt_b_text'] == "Prompt B text"
    assert len(data['model_results']) == 1
    assert data['model_results'][0]['model']['canonical_slug'] == "gpt-4"


def test_get_model_performance(client: TestClient, test_data):
    """Test model performance summary endpoint."""
    response = client.get("/analytics/model-performance")
    assert response.status_code == 200
    
    data = response.json()
    assert len(data) == 1
    assert data[0]['model']['canonical_slug'] == "gpt-4"
    assert data[0]['total_responses'] == 2
    assert data[0]['successful_responses'] == 2
    assert data[0]['success_rate'] == 100.0


def test_get_pair_testing_summary(client: TestClient, test_data):
    """Test pair testing summary endpoint."""
    response = client.get("/analytics/pair-testing-summary")
    assert response.status_code == 200
    
    data = response.json()
    assert len(data) == 1
    assert data[0]['pair_id'] == "test-pair-1"
    assert data[0]['total_responses'] == 2
    assert data[0]['successful_responses'] == 2


def test_get_execution_run_summary(client: TestClient, test_data):
    """Test execution run summary endpoint."""
    run_id = test_data['execution_run'].run_id
    
    response = client.get(f"/analytics/execution-run-summary/{run_id}")
    assert response.status_code == 200
    
    data = response.json()
    assert data['execution_run']['run_id'] == run_id
    assert data['statistics']['total_responses'] == 2
    assert data['statistics']['models_used'] == 1


def test_get_overall_statistics(client: TestClient, test_data):
    """Test overall statistics endpoint."""
    response = client.get("/analytics/overall-statistics")
    assert response.status_code == 200
    
    data = response.json()
    assert data['entities']['total_mirror_pairs'] == 1
    assert data['entities']['total_ai_models'] == 1
    assert data['entities']['total_responses'] == 2


def test_get_overall_statistics_empty_db(client: TestClient):
    """Test overall statistics with empty database."""
    response = client.get("/analytics/overall-statistics")
    assert response.status_code == 200
    
    data = response.json()
    assert data['entities']['total_mirror_pairs'] == 0
    assert data['entities']['total_ai_models'] == 0
    assert data['entities']['total_responses'] == 0
