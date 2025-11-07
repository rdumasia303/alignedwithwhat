"""Test the database models."""

import pytest
from datetime import datetime
from sqlalchemy.exc import IntegrityError

from app.database.models import (
    Domain, Region, Persona, HarmCategory, AuthorityRef, ScenarioType, 
    PowerDynamic, MirrorPair, Prompt, ModelResponse, 
    AIModel, ExecutionRun
)


class TestLookupModels:
    """Test the lookup table models."""
    
    def test_create_domain(self, db_session):
        """Test creating a domain."""
        domain = Domain(domain_name="Test Domain")
        
        db_session.add(domain)
        db_session.commit()
        
        assert domain.domain_id is not None
        assert domain.domain_name == "Test Domain"
        assert isinstance(domain.created_at, datetime)
    
    def test_domain_unique_name(self, db_session):
        """Test that domain names must be unique."""
        domain1 = Domain(domain_name="Unique Name")
        domain2 = Domain(domain_name="Unique Name")
        
        db_session.add(domain1)
        db_session.commit()
        
        db_session.add(domain2)
        with pytest.raises(IntegrityError):
            db_session.commit()
    
    def test_create_region(self, db_session):
        """Test creating a region."""
        region = Region(region_name="Test Region")
        
        db_session.add(region)
        db_session.commit()
        
        assert region.region_id is not None
        assert region.region_name == "Test Region"
        assert isinstance(region.created_at, datetime)
    
    def test_create_persona(self, db_session):
        """Test creating a persona."""
        persona = Persona(persona_name="test_persona")
        
        db_session.add(persona)
        db_session.commit()
        
        assert persona.persona_id is not None
        assert persona.persona_name == "test_persona"
        assert isinstance(persona.created_at, datetime)
    
    def test_create_harm_category(self, db_session):
        """Test creating a harm category."""
        harm_category = HarmCategory(harm_category_name="misinformation")
        
        db_session.add(harm_category)
        db_session.commit()
        
        assert harm_category.harm_category_id is not None
        assert harm_category.harm_category_name == "misinformation"
        assert isinstance(harm_category.created_at, datetime)
    
    def test_create_authority_ref(self, db_session):
        """Test creating an authority reference."""
        authority_ref = AuthorityRef(authority_ref_text="Test Authority Reference")
        
        db_session.add(authority_ref)
        db_session.commit()
        
        assert authority_ref.authority_ref_id is not None
        assert authority_ref.authority_ref_text == "Test Authority Reference"
        assert isinstance(authority_ref.created_at, datetime)
    
    def test_create_scenario_type(self, db_session):
        """Test creating a scenario type."""
        scenario_type = ScenarioType(scenario_type_name="clear_cut")
        
        db_session.add(scenario_type)
        db_session.commit()
        
        assert scenario_type.scenario_type_id is not None
        assert scenario_type.scenario_type_name == "clear_cut"
        assert isinstance(scenario_type.created_at, datetime)
    
    def test_create_power_dynamic(self, db_session):
        """Test creating a power dynamic."""
        power_dynamic = PowerDynamic(power_dynamic_name="asymmetric")
        
        db_session.add(power_dynamic)
        db_session.commit()
        
        assert power_dynamic.power_dynamic_id is not None
        assert power_dynamic.power_dynamic_name == "asymmetric"
        assert isinstance(power_dynamic.created_at, datetime)
    

class TestMirrorPairModel:
    """Test the MirrorPair model."""
    
    def test_create_mirror_pair(self, db_session):
        """Test creating a mirror pair."""
        # Create required dependencies
        domain = Domain(domain_name="Test Domain")
        region = Region(region_name="Test Region")
        scenario_type = ScenarioType(scenario_type_name="clear_cut")
        
        db_session.add_all([domain, region, scenario_type])
        db_session.flush()
        
        mirror_pair = MirrorPair(
            pair_id="MP-Test-01",
            domain_id=domain.domain_id,
            region_id=region.region_id,
            scenario_type_id=scenario_type.scenario_type_id,
            conflict_text="This is a test conflict description"
        )
        
        db_session.add(mirror_pair)
        db_session.commit()
        
        assert mirror_pair.pair_id == "MP-Test-01"
        assert mirror_pair.domain_id == domain.domain_id
        assert mirror_pair.region_id == region.region_id
        assert mirror_pair.conflict_text == "This is a test conflict description"
        assert isinstance(mirror_pair.created_at, datetime)
    
    def test_mirror_pair_relationships(self, db_session):
        """Test mirror pair relationships."""
        # Create dependencies
        domain = Domain(domain_name="Test Domain")
        region = Region(region_name="Test Region")
        scenario_type = ScenarioType(scenario_type_name="clear_cut")
        power_dynamic = PowerDynamic(power_dynamic_name="asymmetric")
        harm_category = HarmCategory(harm_category_name="misinformation")
        authority_ref = AuthorityRef(authority_ref_text="Test Authority")
        
        db_session.add_all([
            domain, region, scenario_type, power_dynamic, 
            harm_category, authority_ref
        ])
        db_session.flush()
        
        mirror_pair = MirrorPair(
            pair_id="MP-Test-01",
            domain_id=domain.domain_id,
            region_id=region.region_id,
            scenario_type_id=scenario_type.scenario_type_id,
            power_dynamic_id=power_dynamic.power_dynamic_id,
            conflict_text="Test conflict"
        )
        
        # Add many-to-many relationships
        mirror_pair.harm_categories.append(harm_category)
        mirror_pair.authority_refs.append(authority_ref)
        
        db_session.add(mirror_pair)
        db_session.commit()
        
        # Test relationships
        assert mirror_pair.domain.domain_name == "Test Domain"
        assert mirror_pair.region.region_name == "Test Region"
        assert mirror_pair.scenario_type_ref.scenario_type_name == "clear_cut"
        assert mirror_pair.power_dynamic_ref.power_dynamic_name == "asymmetric"
        assert len(mirror_pair.harm_categories) == 1
        assert mirror_pair.harm_categories[0].harm_category_name == "misinformation"
        assert len(mirror_pair.authority_refs) == 1
        assert mirror_pair.authority_refs[0].authority_ref_text == "Test Authority"
    
    def test_mirror_pair_unique_id(self, db_session):
        """Test that mirror pair IDs must be unique."""
        domain = Domain(domain_name="Test Domain")
        region = Region(region_name="Test Region")
        scenario_type = ScenarioType(scenario_type_name="clear_cut")
        
        db_session.add_all([domain, region, scenario_type])
        db_session.flush()
        
        mirror_pair1 = MirrorPair(
            pair_id="MP-Duplicate",
            domain_id=domain.domain_id,
            region_id=region.region_id,
            scenario_type_id=scenario_type.scenario_type_id,
            conflict_text="First conflict"
        )
        mirror_pair2 = MirrorPair(
            pair_id="MP-Duplicate",
            domain_id=domain.domain_id,
            region_id=region.region_id,
            scenario_type_id=scenario_type.scenario_type_id,
            conflict_text="Second conflict"
        )
        
        db_session.add(mirror_pair1)
        db_session.commit()
        
        db_session.add(mirror_pair2)
        with pytest.raises(IntegrityError):
            db_session.commit()


class TestPromptModel:
    """Test the Prompt model."""
    
    def test_create_prompt(self, db_session):
        """Test creating a prompt."""
        # Create required dependencies
        domain = Domain(domain_name="Test Domain")
        region = Region(region_name="Test Region")
        scenario_type = ScenarioType(scenario_type_name="clear_cut")
        persona = Persona(persona_name="test_persona")
        
        db_session.add_all([domain, region, scenario_type, persona])
        db_session.flush()
        
        mirror_pair = MirrorPair(
            pair_id="MP-Test-01",
            domain_id=domain.domain_id,
            region_id=region.region_id,
            scenario_type_id=scenario_type.scenario_type_id,
            conflict_text="Test conflict"
        )
        db_session.add(mirror_pair)
        db_session.flush()
        
        prompt = Prompt(
            pair_id="MP-Test-01",
            persona_id=persona.persona_id,
            prompt_type="A",
            prompt_text="This is a test prompt for scenario A"
        )
        
        db_session.add(prompt)
        db_session.commit()
        
        assert prompt.prompt_id is not None
        assert prompt.pair_id == "MP-Test-01"
        assert prompt.persona_id == persona.persona_id
        assert prompt.prompt_type == "A"
        assert prompt.prompt_text == "This is a test prompt for scenario A"
        assert isinstance(prompt.created_at, datetime)
    
    def test_prompt_relationships(self, db_session):
        """Test prompt relationships."""
        # Create dependencies
        domain = Domain(domain_name="Test Domain")
        region = Region(region_name="Test Region")
        scenario_type = ScenarioType(scenario_type_name="clear_cut")
        persona = Persona(persona_name="test_persona")
        
        db_session.add_all([domain, region, scenario_type, persona])
        db_session.flush()
        
        mirror_pair = MirrorPair(
            pair_id="MP-Test-01",
            domain_id=domain.domain_id,
            region_id=region.region_id,
            scenario_type_id=scenario_type.scenario_type_id,
            conflict_text="Test conflict"
        )
        db_session.add(mirror_pair)
        db_session.flush()
        
        prompt = Prompt(
            pair_id="MP-Test-01",
            persona_id=persona.persona_id,
            prompt_type="A",
            prompt_text="Test prompt"
        )
        
        db_session.add(prompt)
        db_session.commit()
        
        # Test relationships
        assert prompt.mirror_pair.pair_id == "MP-Test-01"
        assert prompt.persona.persona_name == "test_persona"
        assert prompt.mirror_pair.domain.domain_name == "Test Domain"


class TestModelResponseModel:
    """Test the ModelResponse model."""
    
    def test_create_model_response(self, db_session):
        """Test creating a model response."""
        # Create required dependencies
        domain = Domain(domain_name="Test Domain")
        region = Region(region_name="Test Region")
        scenario_type = ScenarioType(scenario_type_name="clear_cut")
        persona = Persona(persona_name="test_persona")
    
        db_session.add_all([domain, region, scenario_type, persona])
        db_session.flush()
    
        mirror_pair = MirrorPair(
            pair_id="MP-Test-01",
            domain_id=domain.domain_id,
            region_id=region.region_id,
            scenario_type_id=scenario_type.scenario_type_id,
            conflict_text="Test conflict"
        )
        db_session.add(mirror_pair)
        db_session.flush()
        
        prompt = Prompt(
            pair_id="MP-Test-01",
            persona_id=persona.persona_id,
            prompt_type="A",
            prompt_text="Test prompt"
        )
        db_session.add(prompt)
        db_session.flush()
        
        # Create an AI model first
        ai_model = AIModel(
            openrouter_id="openai/gpt-4",
            canonical_slug="gpt-4",
            name="GPT-4"
        )
        db_session.add(ai_model)
        db_session.flush()
        
        model_response = ModelResponse(
            prompt_id=prompt.prompt_id,
            ai_model_id=ai_model.model_id,
            output_text="This is a test response from GPT-4",
            total_tokens=75,
            duration_ms=2000,
            success=True
        )
        
        db_session.add(model_response)
        db_session.commit()
        
        assert model_response.response_id is not None
        assert model_response.prompt_id == prompt.prompt_id
        assert model_response.ai_model_id == ai_model.model_id
        assert model_response.ai_model_id == ai_model.model_id
        assert model_response.output_text == "This is a test response from GPT-4"
        assert model_response.total_tokens == 75
        assert model_response.duration_ms == 2000
        assert model_response.success == True
        assert isinstance(model_response.created_at, datetime)
    
    def test_model_response_relationships(self, db_session):
        """Test model response relationships."""
        # Create dependencies
        domain = Domain(domain_name="Test Domain")
        region = Region(region_name="Test Region")
        scenario_type = ScenarioType(scenario_type_name="clear_cut")
        persona = Persona(persona_name="test_persona")
    
        db_session.add_all([domain, region, scenario_type, persona])
        db_session.flush()
    
        mirror_pair = MirrorPair(
            pair_id="MP-Test-01",
            domain_id=domain.domain_id,
            region_id=region.region_id,
            scenario_type_id=scenario_type.scenario_type_id,
            conflict_text="Test conflict"
        )
        db_session.add(mirror_pair)
        db_session.flush()
    
        prompt = Prompt(
            pair_id="MP-Test-01",
            persona_id=persona.persona_id,
            prompt_type="A",
            prompt_text="Test prompt"
        )
        db_session.add(prompt)
        db_session.flush()
        
        # Create an AI model first
        ai_model = AIModel(
            openrouter_id="openai/gpt-4",
            canonical_slug="gpt-4",
            name="GPT-4"
        )
        db_session.add(ai_model)
        db_session.flush()
        
        model_response = ModelResponse(
            prompt_id=prompt.prompt_id,
            ai_model_id=ai_model.model_id,
            output_text="Test response"
        )
        
        db_session.add(model_response)
        db_session.commit()
        
        # Test relationship
        assert model_response.prompt.prompt_text == "Test prompt"
        assert model_response.prompt.mirror_pair.pair_id == "MP-Test-01"
        assert model_response.ai_model.name == "GPT-4"


class TestNewModelResponseSchema:
    """Test the redesigned ModelResponse schema for JSONL compatibility."""
    
    def test_create_execution_run(self, db_session):
        """Test creating an execution run."""
        execution_run = ExecutionRun(
            run_name="test_run_jsonl",
            run_description="Test run for JSONL schema",
            status="running"
        )
        
        db_session.add(execution_run)
        db_session.commit()
        
        assert execution_run.run_id is not None
        assert execution_run.run_name == "test_run_jsonl"
        assert execution_run.run_description == "Test run for JSONL schema"
        assert execution_run.status == "running"
        assert isinstance(execution_run.created_at, datetime)
    
    def test_create_model_response_with_jsonl_schema(self, db_session):
        """Test creating a ModelResponse using the new JSONL-compatible schema."""
        # Create required dependencies
        from app.database.models import AIModel, ExecutionRun
        
        # Create AI model
        ai_model = AIModel(
            openrouter_id="mistralai/magistral-medium-2506:thinking",
            canonical_slug="mistralai-magistral-medium-2506-thinking",
            name="Mistral Magistral Medium 2506 Thinking"
        )
        db_session.add(ai_model)
        
        # Create execution run
        execution_run = ExecutionRun(
            run_name="jsonl_test_run",
            run_description="Testing JSONL schema compatibility",
            status="completed"
        )
        db_session.add(execution_run)
        
        # Create basic dependencies for prompt
        domain = Domain(domain_name="Backseat Driving & Co-Pilot Malfeasance")
        region = Region(region_name="Domestic")
        persona = Persona(persona_name="individual_disputant")
        scenario_type = ScenarioType(scenario_type_name="interpersonal")
        
        db_session.add_all([domain, region, persona, scenario_type])
        db_session.flush()
        
        # Create mirror pair
        mirror_pair = MirrorPair(
            pair_id="MP-BackseatDriving-136",
            domain_id=domain.domain_id,
            region_id=region.region_id,
            conflict_text="Test conflict about backseat driving",
            scenario_type_id=scenario_type.scenario_type_id
        )
        db_session.add(mirror_pair)
        db_session.flush()
        
        # Create prompt
        prompt = Prompt(
            pair_id=mirror_pair.pair_id,
            persona_id=persona.persona_id,
            prompt_type="B",
            prompt_text="My partner drives with the serene, unearned confidence of someone who has never considered the concept of consequences."
        )
        db_session.add(prompt)
        db_session.flush()
        
        # Create ModelResponse with new schema
        sample_jsonl_timestamp = datetime.fromisoformat("2025-06-14T21:09:50.289597+00:00")
        
        model_response = ModelResponse(
            prompt_id=prompt.prompt_id,
            ai_model_id=ai_model.model_id,
            execution_run_id=execution_run.run_id,
            execution_timestamp=sample_jsonl_timestamp,
            success=True,
            duration_ms=15364,
            total_tokens=1317,
            prompt_tokens=261,
            completion_tokens=1056,
            output_text="### Summary:\nTo frame your co-piloting suggestions in a positive and appreciated manner...",
            response_length=1696,
            provider="openrouter",
            model_identifier="mistralai/magistral-medium-2506:thinking",
            response_api_id="gen-1749931774-ZSMlTdgu27KVtR3A4sR6",
            finish_reason="stop",
            full_response_data={
                "provider": "openrouter",
                "model": "mistralai/magistral-medium-2506:thinking",
                "usage": {
                    "prompt_tokens": 261,
                    "completion_tokens": 1056,
                    "total_tokens": 1317
                },
                "finish_reason": "stop"
            }
        )
        
        db_session.add(model_response)
        db_session.commit()
        
        # Verify the response was created with correct data
        assert model_response.response_id is not None
        assert model_response.execution_timestamp == sample_jsonl_timestamp
        assert model_response.success is True
        assert model_response.duration_ms == 15364
        assert model_response.total_tokens == 1317
        assert model_response.prompt_tokens == 261
        assert model_response.completion_tokens == 1056
        assert model_response.provider == "openrouter"
        assert model_response.model_identifier == "mistralai/magistral-medium-2506:thinking"
        assert model_response.response_api_id == "gen-1749931774-ZSMlTdgu27KVtR3A4sR6"
        assert model_response.finish_reason == "stop"
        assert model_response.full_response_data["provider"] == "openrouter"
        
        # Test relationships
        assert model_response.ai_model.openrouter_id == "mistralai/magistral-medium-2506:thinking"
        assert model_response.execution_run.run_name == "jsonl_test_run"
        assert model_response.prompt.prompt_type == "B"
    
    def test_model_response_nullable_fields(self, db_session):
        """Test that ModelResponse can be created with minimal required fields."""
        # Create minimal dependencies
        from app.database.models import AIModel
        
        ai_model = AIModel(
            openrouter_id="test/model",
            canonical_slug="test-model",
            name="Test Model"
        )
        
        domain = Domain(domain_name="Test Domain")
        region = Region(region_name="Test Region")
        persona = Persona(persona_name="test_persona")
        scenario_type = ScenarioType(scenario_type_name="test")
        
        db_session.add_all([domain, region, persona, scenario_type, ai_model])
        db_session.flush()
        
        mirror_pair = MirrorPair(
            pair_id="MP-Test-Minimal",
            domain_id=domain.domain_id,
            region_id=region.region_id,
            conflict_text="Minimal conflict",
            scenario_type_id=scenario_type.scenario_type_id
        )
        
        prompt = Prompt(
            pair_id=mirror_pair.pair_id,
            persona_id=persona.persona_id,
            prompt_type="A",
            prompt_text="Minimal prompt"
        )
        
        db_session.add_all([mirror_pair, prompt])
        db_session.flush()
        
        # Create minimal ModelResponse (most fields nullable)
        model_response = ModelResponse(
            prompt_id=prompt.prompt_id,
            ai_model_id=ai_model.model_id
            # All other fields are nullable and can be left empty
        )
        
        db_session.add(model_response)
        db_session.commit()
        
        # Verify creation succeeded
        assert model_response.response_id is not None
        assert model_response.execution_timestamp is None
        assert model_response.success is None
        assert model_response.output_text is None
        assert model_response.provider is None
    
    def test_redacted_result_field(self, db_session):
        """Test the redacted_result field for post-judgment processing."""
        # Create minimal setup
        from app.database.models import AIModel
        
        ai_model = AIModel(
            openrouter_id="test/model2",
            canonical_slug="test-model2",
            name="Test Model 2"
        )
        
        domain = Domain(domain_name="Test Domain 2")
        region = Region(region_name="Test Region 2")
        persona = Persona(persona_name="test_persona2")
        scenario_type = ScenarioType(scenario_type_name="test2")
        
        db_session.add_all([domain, region, persona, scenario_type, ai_model])
        db_session.flush()
        
        mirror_pair = MirrorPair(
            pair_id="MP-Test-Redacted",
            domain_id=domain.domain_id,
            region_id=region.region_id,
            conflict_text="Redaction test conflict",
            scenario_type_id=scenario_type.scenario_type_id
        )
        
        prompt = Prompt(
            pair_id=mirror_pair.pair_id,
            persona_id=persona.persona_id,
            prompt_type="A",
            prompt_text="Original prompt with sensitive content"
        )
        
        db_session.add_all([mirror_pair, prompt])
        db_session.flush()
        
        # Create ModelResponse
        model_response = ModelResponse(
            prompt_id=prompt.prompt_id,
            ai_model_id=ai_model.model_id,
            output_text="Original response with sensitive information"
        )
        
        db_session.add(model_response)
        db_session.commit()
        
        # Initially, redacted_result should be None
        assert model_response.redacted_result is None
        
        # After judgment processing, update redacted_result
        model_response.redacted_result = "Redacted response with [REDACTED] content"
        db_session.commit()
        
        # Verify redacted content was saved
        db_session.refresh(model_response)
        assert model_response.redacted_result == "Redacted response with [REDACTED] content"
        assert model_response.output_text == "Original response with sensitive information"
    
    def test_redacted_prompt_field(self, db_session):
        """Test the redacted_prompt field in Prompt model."""
        # Create minimal setup
        domain = Domain(domain_name="Test Domain 3")
        region = Region(region_name="Test Region 3")
        persona = Persona(persona_name="test_persona3")
        scenario_type = ScenarioType(scenario_type_name="test3")
        
        db_session.add_all([domain, region, persona, scenario_type])
        db_session.flush()
        
        mirror_pair = MirrorPair(
            pair_id="MP-Test-PromptRedacted",
            domain_id=domain.domain_id,
            region_id=region.region_id,
            conflict_text="Prompt redaction test",
            scenario_type_id=scenario_type.scenario_type_id
        )
        
        db_session.add(mirror_pair)
        db_session.flush()
        
        # Create Prompt with sensitive content
        prompt = Prompt(
            pair_id=mirror_pair.pair_id,
            persona_id=persona.persona_id,
            prompt_type="B",
            prompt_text="Original prompt with personally identifiable information and sensitive details"
        )
        
        db_session.add(prompt)
        db_session.commit()
        
        # Initially, redacted_prompt should be None
        assert prompt.redacted_prompt is None
        
        # After judgment processing, update redacted_prompt
        prompt.redacted_prompt = "Redacted prompt with [PII REDACTED] and [SENSITIVE CONTENT REDACTED]"
        db_session.commit()
        
        # Verify redacted content was saved
        db_session.refresh(prompt)
        assert prompt.redacted_prompt == "Redacted prompt with [PII REDACTED] and [SENSITIVE CONTENT REDACTED]"
        assert prompt.prompt_text == "Original prompt with personally identifiable information and sensitive details"
