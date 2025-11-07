"""
Pydantic schemas for the database models.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


# Lookup Table Schemas
class PersonaBase(BaseModel):
    persona_name: str = Field(..., description="Name of the persona")

class PersonaCreate(PersonaBase):
    pass

class Persona(PersonaBase):
    persona_id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class DomainBase(BaseModel):
    domain_name: str = Field(..., description="Name of the domain")

class DomainCreate(DomainBase):
    pass

class Domain(DomainBase):
    domain_id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class RegionBase(BaseModel):
    region_name: str = Field(..., description="Name of the region")

class RegionCreate(RegionBase):
    pass

class Region(RegionBase):
    region_id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class HarmCategoryBase(BaseModel):
    harm_category_name: str = Field(..., description="Name of the harm category")

class HarmCategoryCreate(HarmCategoryBase):
    pass

class HarmCategory(HarmCategoryBase):
    harm_category_id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class ScenarioTypeBase(BaseModel):
    scenario_type_name: str = Field(..., description="Name of the scenario type")

class ScenarioTypeCreate(ScenarioTypeBase):
    pass

class ScenarioType(ScenarioTypeBase):
    scenario_type_id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class AuthorityRefBase(BaseModel):
    authority_ref_text: str = Field(..., description="Text of the authority reference")

class AuthorityRefCreate(AuthorityRefBase):
    pass

class AuthorityRef(AuthorityRefBase):
    authority_ref_id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class PowerDynamicBase(BaseModel):
    power_dynamic_name: str = Field(..., description="Name of the power dynamic")

class PowerDynamicCreate(PowerDynamicBase):
    pass

class PowerDynamic(PowerDynamicBase):
    power_dynamic_id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class SeverityLevelBase(BaseModel):
    severity_level_name: str = Field(..., description="Name of the severity level")
    severity_weight: int = Field(..., description="Numeric weight for ordering (1=low, 5=critical)")

class SeverityLevelCreate(SeverityLevelBase):
    pass

class SeverityLevel(SeverityLevelBase):
    severity_level_id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# Core Model Schemas
class PromptBase(BaseModel):
    pair_id: str = Field(..., description="ID of the mirror pair")
    persona_id: int = Field(..., description="ID of the persona")
    prompt_type: str = Field(..., description="Type of prompt (A or B)")
    prompt_text: str = Field(..., description="Text content of the prompt")

class PromptCreate(PromptBase):
    pass

class PromptUpdate(BaseModel):
    prompt_text: Optional[str] = None

class Prompt(PromptBase):
    prompt_id: int
    created_at: datetime    
    
    model_config = ConfigDict(from_attributes=True)


class PromptWithPersona(BaseModel):
    prompt_id: int
    pair_id: str
    persona_id: int
    prompt_type: str
    prompt_text: str
    created_at: datetime
    persona: Persona
    
    model_config = ConfigDict(from_attributes=True)


class MirrorPairBase(BaseModel):
    pair_id: str = Field(..., description="Unique identifier for the mirror pair")
    domain_id: int = Field(..., description="ID of the domain")
    region_id: int = Field(..., description="ID of the region")
    conflict_text: str = Field(..., description="Description of the conflict")
    scenario_type_id: int = Field(..., description="ID of the scenario type")
    power_dynamic_id: Optional[int] = Field(None, description="ID of the power dynamic")
    weaponized_assistance: Optional[bool] = Field(None, description="Whether this scenario involves weaponized assistance")
    severity_level_id: Optional[int] = Field(None, description="ID of the severity level")

class MirrorPairCreate(MirrorPairBase):
    pass

class MirrorPair(MirrorPairBase):
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


# Full nested MirrorPair with all related data
class MirrorPairFull(MirrorPairBase):
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Related lookup data
    domain: Domain
    region: Region
    scenario_type_ref: ScenarioType
    power_dynamic_ref: Optional[PowerDynamic] = None
    severity_level_ref: Optional[SeverityLevel] = None
    
    # Related prompts with personas
    prompts: List[PromptWithPersona] = []
    
    # Many-to-many relationships
    harm_categories: List[HarmCategory] = []
    authority_refs: List[AuthorityRef] = []
    
    model_config = ConfigDict(from_attributes=True)


class ModelResponseBase(BaseModel):
    prompt_id: int = Field(..., description="ID of the prompt")
    ai_model_id: int = Field(..., description="ID of the AI model")
    execution_run_id: Optional[int] = Field(None, description="ID of the execution run")
    
    # Execution metadata from JSONL structure
    execution_timestamp: Optional[datetime] = Field(None, description="Timestamp when the model was executed")
    success: Optional[bool] = Field(None, description="Whether the model execution was successful")
    duration_ms: Optional[int] = Field(None, description="Total execution duration in milliseconds")
    
    # Token usage metrics
    total_tokens: Optional[int] = Field(None, description="Total tokens used")
    prompt_tokens: Optional[int] = Field(None, description="Prompt tokens used")
    completion_tokens: Optional[int] = Field(None, description="Completion tokens used")
    
    # Response content and metadata
    output_text: Optional[str] = Field(None, description="The actual model response")
    response_length: Optional[int] = Field(None, description="Character count of response")
    
    # Provider/API metadata
    provider: Optional[str] = Field(None, description="Provider (e.g., 'openrouter')")
    model_identifier: Optional[str] = Field(None, description="Full model path from provider")
    response_api_id: Optional[str] = Field(None, description="Provider's response ID")
    finish_reason: Optional[str] = Field(None, description="Reason the response finished")
    
    # Full response payload for debugging
    full_response_data: Optional[Dict[str, Any]] = Field(None, description="Complete response payload")
    
    # Redacted result (filled in after judging)
    redacted_result: Optional[str] = Field(None, description="Redacted version of the result")
    
    # Legacy fields (for backward compatibility)
    model_name: Optional[str] = Field(None, description="Legacy model name field")
    response_text: Optional[str] = Field(None, description="Legacy response text field")
    tokens_used: Optional[int] = Field(None, description="Legacy tokens used field")
    response_time_ms: Optional[int] = Field(None, description="Legacy response time field")
    temperature: Optional[float] = Field(None, description="Legacy temperature field")
    max_tokens: Optional[int] = Field(None, description="Legacy max tokens field")
    extra_metadata: Optional[Dict[str, Any]] = Field(None, description="Legacy metadata field")

class ModelResponseCreate(ModelResponseBase):
    pass

class ModelResponse(ModelResponseBase):
    response_id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ModelResponseWithModel(BaseModel):
    """ModelResponse with full AI model details."""
    response_id: int
    prompt_id: int
    output_text: Optional[str] = None
    total_tokens: Optional[int] = None
    duration_ms: Optional[int] = None
    success: Optional[bool] = None
    provider: Optional[str] = None
    model_identifier: Optional[str] = None
    execution_timestamp: Optional[datetime] = None
    created_at: datetime
    
    # Full AI model details
    ai_model: "AIModel"
    
    model_config = ConfigDict(from_attributes=True)


# Ingestion Response Schema
class IngestionResult(BaseModel):
    success: bool
    message: str
    ingested_count: Optional[int] = None
    skipped_count: Optional[int] = None
    details: Optional[List[Dict[str, Any]]] = None


# AI Model Schemas
class AIModelBase(BaseModel):
    openrouter_id: str = Field(..., description="OpenRouter model ID")
    canonical_slug: str = Field(..., description="OpenRouter canonical slug (version-specific)")
    name: str = Field(..., description="Human-readable model name")
    description: Optional[str] = Field(None, description="Model description")
    created_timestamp: Optional[int] = Field(None, description="Unix timestamp when model was created")
    context_length: Optional[int] = Field(None, description="Maximum context length in tokens")
    max_completion_tokens: Optional[int] = Field(None, description="Maximum completion tokens")
    is_moderated: Optional[bool] = Field(None, description="Whether the model is moderated")
    prompt_price: Optional[str] = Field(None, description="Price per prompt token")
    completion_price: Optional[str] = Field(None, description="Price per completion token")
    request_price: Optional[str] = Field(None, description="Price per request")
    image_price: Optional[str] = Field(None, description="Price per image")
    architecture: Optional[Dict[str, Any]] = Field(None, description="Model architecture details")
    supported_parameters: Optional[Dict[str, Any]] = Field(None, description="Supported parameters")
    is_active: bool = Field(True, description="Whether the model is currently active")

class AIModelCreate(AIModelBase):
    pass

class AIModelUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    context_length: Optional[int] = None
    max_completion_tokens: Optional[int] = None
    is_moderated: Optional[bool] = None
    prompt_price: Optional[str] = None
    completion_price: Optional[str] = None
    request_price: Optional[str] = None
    image_price: Optional[str] = None
    architecture: Optional[Dict[str, Any]] = None
    supported_parameters: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class AIModel(AIModelBase):
    model_id: int
    last_updated: datetime
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class ExecutionRunBase(BaseModel):
    run_name: Optional[str] = Field(None, description="Name of the execution run")
    run_description: Optional[str] = Field(None, description="Description of the run")
    status: str = Field("running", description="Status of the run")

class ExecutionRunCreate(ExecutionRunBase):
    pass

class ExecutionRun(ExecutionRunBase):
    run_id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
