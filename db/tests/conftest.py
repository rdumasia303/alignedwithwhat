"""Test configuration and fixtures."""

import os
import pytest
import asyncio
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.core.config import Base, get_db
from app.main import app


# Test database URL - use test container when available, otherwise local test DB
TEST_DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://postgres:postgres123@localhost:5433/alignedwithwhat_test"
)

# Create test engine
test_engine = create_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    """Override database dependency for testing."""
    try:
        db = TestSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Set up test database schema once per test session."""
    # Create all tables
    Base.metadata.create_all(bind=test_engine)
    yield
    # Drop all tables after all tests complete
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test with transaction rollback."""
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestSessionLocal(bind=connection)
    
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with database session override."""
    def override_get_db_for_test():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db_for_test
    
    with TestClient(app) as test_client:
        yield test_client
    
    # Reset dependency override
    app.dependency_overrides[get_db] = override_get_db


@pytest.fixture
def sample_mirror_pair_data():
    """Sample mirror pair data for testing."""
    return {
        "mirror_pair": {
            "id": "MP-Test-01",
            "domain": "Test Domain",
            "region": "North America",
            "scenario_type": "clear_cut",
            "power_dynamic": "asymmetric",
            "harm_categories": ["misinformation", "bias"],
            "authority_refs": ["Test Authority Reference"],
            "conflict": "A test conflict description for testing purposes.",
            "persona_a": "concerned_citizen",
            "persona_b": "authority_figure",
            "prompt_a": "This is test prompt A from a concerned citizen persona.",
            "prompt_b": "This is test prompt B from an authority figure persona."
        }
    }


@pytest.fixture
def sample_yaml_content():
    """Sample YAML content for testing ingestion."""
    return """
- mirror_pair:
    id: MP-Test-01
    domain: Test Domain
    region: North America
    scenario_type: clear_cut
    power_dynamic: asymmetric
    harm_categories: [misinformation, bias]
    authority_refs: [Test Authority Reference]
    persona_a: concerned_citizen
    persona_b: authority_figure
    conflict: >
      A test conflict description for testing purposes.
      This conflict involves multiple stakeholders.
    prompt_a: >
      This is test prompt A from a concerned citizen persona.
      It expresses concern about the situation.
    prompt_b: >
      This is test prompt B from an authority figure persona.
      It takes a different perspective on the same issue.
- mirror_pair:
    id: MP-Test-02
    domain: Another Test Domain
    region: EU
    scenario_type: gray_area
    power_dynamic: symmetric
    harm_categories: [harassment, discrimination]
    authority_refs: [EU Test Authority, Second Authority]
    persona_a: concerned_citizen
    persona_b: expert
    conflict: Another test conflict description for the second mirror pair
    prompt_a: Second mirror pair citizen prompt A
    prompt_b: Expert perspective prompt B
"""


@pytest.fixture
def sample_persona(db_session):
    """Create a sample persona for testing."""
    from app.database.models import Persona
    persona = Persona(persona_name="Test Persona")
    return persona


@pytest.fixture
def sample_domain(db_session):
    """Create a sample domain for testing."""
    from app.database.models import Domain
    domain = Domain(domain_name="Test Domain")
    return domain


@pytest.fixture
def sample_region(db_session):
    """Create a sample region for testing."""
    from app.database.models import Region
    region = Region(region_name="Test Region")
    return region


@pytest.fixture
def sample_harm_category(db_session):
    """Create a sample harm category for testing."""
    from app.database.models import HarmCategory
    harm_category = HarmCategory(harm_category_name="Test Harm Category")
    return harm_category


@pytest.fixture
def sample_scenario_type(db_session):
    """Create a sample scenario type for testing."""
    from app.database.models import ScenarioType
    scenario_type = ScenarioType(scenario_type_name="Test Scenario")
    return scenario_type


@pytest.fixture
def sample_authority_ref(db_session):
    """Create a sample authority ref for testing."""
    from app.database.models import AuthorityRef
    authority_ref = AuthorityRef(authority_ref_text="Test Authority")
    return authority_ref


@pytest.fixture
def sample_power_dynamic(db_session):
    """Create a sample power dynamic for testing."""
    from app.database.models import PowerDynamic
    power_dynamic = PowerDynamic(power_dynamic_name="Test Dynamic")
    return power_dynamic


@pytest.fixture
def sample_mirror_pair(db_session, sample_persona, sample_domain, sample_region, 
                      sample_harm_category, sample_scenario_type, sample_authority_ref, 
                      sample_power_dynamic):
    """Create a sample mirror pair for testing."""
    from app.database.models import MirrorPair
    
    # Add all dependencies first
    db_session.add_all([
        sample_persona, sample_domain, sample_region, sample_harm_category, 
        sample_scenario_type, sample_authority_ref, sample_power_dynamic
    ])
    db_session.commit()
    
    mirror_pair = MirrorPair(
        pair_id="test-pair-001",
        bad_prompt="This is a bad prompt",
        good_prompt="This is a good prompt",
        domain_id=sample_domain.domain_id,
        region_id=sample_region.region_id,
        persona_id=sample_persona.persona_id,
        harm_category_id=sample_harm_category.harm_category_id,
        scenario_type_id=sample_scenario_type.scenario_type_id,
        authority_ref_id=sample_authority_ref.authority_ref_id,
        power_dynamic_id=sample_power_dynamic.power_dynamic_id,
    )
    return mirror_pair


@pytest.fixture
def sample_ai_model(db_session):
    """Create a sample AI model for testing."""
    from app.database.models import AIModel
    ai_model = AIModel(
        openrouter_id="test/sample-model",
        model_name="Sample Test Model",
        provider="Test Provider",
        context_length=4096,
        is_active=True,
        pricing_per_1k_tokens=0.001
    )
    return ai_model


@pytest.fixture
def sample_execution_run(db_session):
    """Create a sample execution run for testing."""
    from app.database.models import ExecutionRun
    execution_run = ExecutionRun(
        run_name="Test Execution Run",
        description="A test run for testing",
        status="running",
        total_prompts=100,
        completed_prompts=25
    )
    return execution_run


@pytest.fixture
def sample_prompt(db_session, sample_mirror_pair, sample_persona):
    """Create a sample prompt for testing."""
    from app.database.models import Prompt
    
    # Ensure dependencies are saved
    db_session.add_all([sample_mirror_pair, sample_persona])
    db_session.commit()
    
    prompt = Prompt(
        prompt_text="This is a test prompt",
        pair_id=sample_mirror_pair.pair_id,
        persona_id=sample_persona.persona_id
    )
    return prompt
