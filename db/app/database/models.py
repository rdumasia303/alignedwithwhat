"""SQLAlchemy models for the database schema."""

from datetime import datetime
from typing import List, Optional
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, ForeignKey, 
    JSON, Float, Boolean, Index, Table
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.core.config import Base


# Association tables for many-to-many relationships
pair_harm_categories = Table(
    'pair_harm_categories',
    Base.metadata,
    Column('pair_id', String(50), ForeignKey('mirror_pairs.pair_id'), primary_key=True),
    Column('harm_category_id', Integer, ForeignKey('harm_categories.harm_category_id'), primary_key=True)
)

pair_authority_refs = Table(
    'pair_authority_refs',
    Base.metadata,
    Column('pair_id', String(50), ForeignKey('mirror_pairs.pair_id'), primary_key=True),
    Column('authority_ref_id', Integer, ForeignKey('authority_refs.authority_ref_id'), primary_key=True)
)


# Lookup Tables
class Domain(Base):
    """Domain lookup table for mirror pair domains."""
    
    __tablename__ = "domains"
    
    domain_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    domain_name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    mirror_pairs: Mapped[List["MirrorPair"]] = relationship("MirrorPair", back_populates="domain")
    
    def __repr__(self) -> str:
        return f"<Domain(id={self.domain_id}, name='{self.domain_name}')>"


class Region(Base):
    """Region lookup table for mirror pair regions."""
    
    __tablename__ = "regions"
    
    region_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    region_name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    mirror_pairs: Mapped[List["MirrorPair"]] = relationship("MirrorPair", back_populates="region")
    
    def __repr__(self) -> str:
        return f"<Region(id={self.region_id}, name='{self.region_name}')>"


class Persona(Base):
    """Persona lookup table for different character perspectives."""
    
    __tablename__ = "personas"
    
    persona_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    persona_name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    prompts: Mapped[List["Prompt"]] = relationship("Prompt", back_populates="persona")
    
    def __repr__(self) -> str:
        return f"<Persona(id={self.persona_id}, name='{self.persona_name}')>"


class HarmCategory(Base):
    """Harm category lookup table for mirror pair harm categories."""
    
    __tablename__ = "harm_categories"
    
    harm_category_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    harm_category_name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    mirror_pairs: Mapped[List["MirrorPair"]] = relationship(
        "MirrorPair", 
        secondary=pair_harm_categories, 
        back_populates="harm_categories"
    )
    
    def __repr__(self) -> str:
        return f"<HarmCategory(id={self.harm_category_id}, name='{self.harm_category_name}')>"


class AuthorityRef(Base):
    """Authority reference lookup table for mirror pair authority references."""
    
    __tablename__ = "authority_refs"
    
    authority_ref_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    authority_ref_text: Mapped[str] = mapped_column(String(500), unique=True, nullable=False, index=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    mirror_pairs: Mapped[List["MirrorPair"]] = relationship(
        "MirrorPair", 
        secondary=pair_authority_refs, 
        back_populates="authority_refs"
    )
    
    def __repr__(self) -> str:
        return f"<AuthorityRef(id={self.authority_ref_id}, text='{self.authority_ref_text[:50]}...')>"


class ScenarioType(Base):
    """Scenario type lookup table for mirror pair scenario types."""
    
    __tablename__ = "scenario_types"
    
    scenario_type_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    scenario_type_name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    
    # AVM Protocol fields
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    optimal_archetypes: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    mirror_pairs: Mapped[List["MirrorPair"]] = relationship("MirrorPair", back_populates="scenario_type_ref")
    
    def __repr__(self) -> str:
        return f"<ScenarioType(id={self.scenario_type_id}, name='{self.scenario_type_name}')>"


class PowerDynamic(Base):
    """Power dynamic lookup table for mirror pair power dynamics."""
    
    __tablename__ = "power_dynamics"
    
    power_dynamic_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    power_dynamic_name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    mirror_pairs: Mapped[List["MirrorPair"]] = relationship("MirrorPair", back_populates="power_dynamic_ref")
    
    def __repr__(self) -> str:
        return f"<PowerDynamic(id={self.power_dynamic_id}, name='{self.power_dynamic_name}')>"


class SeverityLevel(Base):
    """Severity level lookup table for mirror pair severity levels."""
    
    __tablename__ = "severity_levels"
    
    severity_level_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    severity_level_name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    severity_weight: Mapped[int] = mapped_column(Integer, nullable=False, comment="Numeric weight for ordering (1=low, 5=critical)")
    
    # AVM Protocol fields
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    scaling_guidance: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    mirror_pairs: Mapped[List["MirrorPair"]] = relationship("MirrorPair", back_populates="severity_level_ref")
    
    def __repr__(self) -> str:
        return f"<SeverityLevel(id={self.severity_level_id}, name='{self.severity_level_name}', weight={self.severity_weight})>"


class MirrorPair(Base):
    """Mirror pair model - the central table for mirror pairs."""
    
    __tablename__ = "mirror_pairs"
    
    # Using natural key as primary key
    pair_id: Mapped[str] = mapped_column(String(50), primary_key=True)
    
    # Foreign keys to lookup tables
    domain_id: Mapped[int] = mapped_column(Integer, ForeignKey("domains.domain_id"), nullable=False)
    region_id: Mapped[int] = mapped_column(Integer, ForeignKey("regions.region_id"), nullable=False)
    
    # Core fields
    conflict_text: Mapped[str] = mapped_column(Text, nullable=False)
    scenario_type_id: Mapped[int] = mapped_column(Integer, ForeignKey("scenario_types.scenario_type_id"), nullable=False)
    power_dynamic_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("power_dynamics.power_dynamic_id"))
    
    # New critical analysis fields
    weaponized_assistance: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True, comment="Whether this scenario involves weaponized assistance")
    severity_level_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("severity_levels.severity_level_id"), comment="Severity level of this scenario")
    
    # Expanded description for judge analysis
    full_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    domain: Mapped["Domain"] = relationship("Domain", back_populates="mirror_pairs")
    region: Mapped["Region"] = relationship("Region", back_populates="mirror_pairs")
    prompts: Mapped[List["Prompt"]] = relationship("Prompt", back_populates="mirror_pair")
    harm_categories: Mapped[List["HarmCategory"]] = relationship(
        "HarmCategory", 
        secondary=pair_harm_categories, 
        back_populates="mirror_pairs"
    )
    authority_refs: Mapped[List["AuthorityRef"]] = relationship(
        "AuthorityRef", 
        secondary=pair_authority_refs, 
        back_populates="mirror_pairs"
    )
    scenario_type_ref: Mapped["ScenarioType"] = relationship("ScenarioType", back_populates="mirror_pairs")
    power_dynamic_ref: Mapped["PowerDynamic"] = relationship("PowerDynamic", back_populates="mirror_pairs")
    severity_level_ref: Mapped[Optional["SeverityLevel"]] = relationship("SeverityLevel", back_populates="mirror_pairs")
    
    # Indexes
    __table_args__ = (
        Index('idx_mirror_pair_domain', 'domain_id'),
        Index('idx_mirror_pair_region', 'region_id'),
        Index('idx_mirror_pair_scenario_type', 'scenario_type_id'),
        Index('idx_mirror_pair_weaponized', 'weaponized_assistance'),
        Index('idx_mirror_pair_severity', 'severity_level_id'),
        Index('idx_mirror_pair_created', 'created_at'),
    )
    
    def __repr__(self) -> str:
        return f"<MirrorPair(pair_id='{self.pair_id}', domain_id={self.domain_id})>"


class Prompt(Base):
    """Prompt model for storing individual A/B prompts."""
    
    __tablename__ = "prompts"
    
    prompt_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    
    # Foreign keys
    pair_id: Mapped[str] = mapped_column(String(50), ForeignKey("mirror_pairs.pair_id"), nullable=False)
    persona_id: Mapped[int] = mapped_column(Integer, ForeignKey("personas.persona_id"), nullable=False)
    
    # Core fields
    prompt_type: Mapped[str] = mapped_column(String(1), nullable=False)  # 'A' or 'B'
    prompt_text: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Redacted version for judging (filled in after judging process)
    redacted_prompt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    mirror_pair: Mapped["MirrorPair"] = relationship("MirrorPair", back_populates="prompts")
    persona: Mapped["Persona"] = relationship("Persona", back_populates="prompts")
    model_responses: Mapped[List["ModelResponse"]] = relationship("ModelResponse", back_populates="prompt")
    
    # Indexes
    __table_args__ = (
        Index('idx_prompt_pair', 'pair_id'),
        Index('idx_prompt_type', 'prompt_type'),
        Index('idx_prompt_persona', 'persona_id'),
        Index('idx_prompt_pair_type', 'pair_id', 'prompt_type'),  # Composite index for common queries
    )
    
    def __repr__(self) -> str:
        return f"<Prompt(id={self.prompt_id}, pair_id='{self.pair_id}', type='{self.prompt_type}')>"


class ModelResponse(Base):
    """Model response for storing AI model outputs."""
    
    __tablename__ = "model_responses"
    
    # Primary key
    response_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    
    # Foreign key relationships
    prompt_id: Mapped[int] = mapped_column(Integer, ForeignKey("prompts.prompt_id"), nullable=False)
    ai_model_id: Mapped[int] = mapped_column(Integer, ForeignKey("ai_models.model_id"), nullable=False)
    execution_run_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("execution_runs.run_id"))
    
    # Execution metadata (top-level JSONL fields)
    execution_timestamp: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    success: Mapped[Optional[bool]] = mapped_column(Boolean)
    duration_ms: Mapped[Optional[int]] = mapped_column(Integer)
    
    # Token usage
    total_tokens: Mapped[Optional[int]] = mapped_column(Integer)
    prompt_tokens: Mapped[Optional[int]] = mapped_column(Integer)
    completion_tokens: Mapped[Optional[int]] = mapped_column(Integer)
    
    # Response content 
    output_text: Mapped[Optional[str]] = mapped_column(Text)  # The actual model response
    response_length: Mapped[Optional[int]] = mapped_column(Integer)  # Character count
    
    # Provider/API metadata from full_response
    provider: Mapped[Optional[str]] = mapped_column(String(100))  # e.g., "openrouter"
    model_identifier: Mapped[Optional[str]] = mapped_column(String(500))  # Full model path
    response_api_id: Mapped[Optional[str]] = mapped_column(String(100))  # Provider's response ID
    finish_reason: Mapped[Optional[str]] = mapped_column(String(50))  # e.g., "stop"
    
    # Full response payload for debugging/analysis
    full_response_data: Mapped[Optional[dict]] = mapped_column(JSON)
    
    # Redacted version for judging (filled in after judging process)
    redacted_result: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    prompt: Mapped["Prompt"] = relationship("Prompt", back_populates="model_responses")
    ai_model: Mapped["AIModel"] = relationship("AIModel", back_populates="model_responses")
    execution_run: Mapped[Optional["ExecutionRun"]] = relationship("ExecutionRun", back_populates="model_responses")
    
    # Indexes
    __table_args__ = (
        Index('idx_model_response_prompt', 'prompt_id'),
        Index('idx_model_response_ai_model', 'ai_model_id'),
        Index('idx_model_response_execution_run', 'execution_run_id'),
        Index('idx_model_response_execution_timestamp', 'execution_timestamp'),
        Index('idx_model_response_success', 'success'),
        Index('idx_model_response_provider', 'provider'),
        Index('idx_model_response_model_identifier', 'model_identifier'),
        Index('idx_model_response_created', 'created_at'),
    )
    
    def __repr__(self) -> str:
        return f"<ModelResponse(id={self.response_id}, ai_model_id={self.ai_model_id}, prompt_id={self.prompt_id}, success={self.success})>"


class AIModel(Base):
    """AI Model lookup table for tracking OpenRouter models."""
    
    __tablename__ = "ai_models"
    
    model_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    
    # Core identifiers from OpenRouter API
    openrouter_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    canonical_slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    
    # Model metadata
    name: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    created_timestamp: Mapped[Optional[int]] = mapped_column(Integer)  # Unix timestamp from OpenRouter
    
    # Technical specs
    context_length: Mapped[Optional[int]] = mapped_column(Integer)
    max_completion_tokens: Mapped[Optional[int]] = mapped_column(Integer)
    is_moderated: Mapped[Optional[bool]] = mapped_column(Boolean)
    
    # Pricing information (stored as strings to maintain precision)
    prompt_price: Mapped[Optional[str]] = mapped_column(String(20))  # Price per prompt token
    completion_price: Mapped[Optional[str]] = mapped_column(String(20))  # Price per completion token
    request_price: Mapped[Optional[str]] = mapped_column(String(20))  # Price per request
    image_price: Mapped[Optional[str]] = mapped_column(String(20))  # Price per image
    
    # Additional metadata as JSON
    architecture: Mapped[Optional[dict]] = mapped_column(JSON)
    supported_parameters: Mapped[Optional[dict]] = mapped_column(JSON)
    
    # Status tracking
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_updated: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    model_responses: Mapped[List["ModelResponse"]] = relationship("ModelResponse", back_populates="ai_model")
    
    # Indexes
    __table_args__ = (
        Index('idx_ai_model_openrouter_id', 'openrouter_id'),
        Index('idx_ai_model_canonical_slug', 'canonical_slug'),
        Index('idx_ai_model_active', 'is_active'),
        Index('idx_ai_model_created', 'created_timestamp'),
    )
    
    def __repr__(self) -> str:
        return f"<AIModel(id={self.model_id}, openrouter_id='{self.openrouter_id}', name='{self.name}')>"


class ExecutionRun(Base):
    """Execution run for tracking batches of model responses."""
    
    __tablename__ = "execution_runs"
    
    run_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    
    # Run identification
    run_name: Mapped[Optional[str]] = mapped_column(String(255))  # e.g., "full_run_gpt41"
    run_description: Mapped[Optional[str]] = mapped_column(Text)
    
    # Run status
    status: Mapped[str] = mapped_column(String(50), default="running", nullable=False)  # running, completed, failed
       
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    model_responses: Mapped[List["ModelResponse"]] = relationship("ModelResponse", back_populates="execution_run")
    
    # Indexes
    __table_args__ = (
        Index('idx_execution_run_status', 'status'),
        Index('idx_execution_run_name', 'run_name'),
    )
    
    def __repr__(self) -> str:
        return f"<ExecutionRun(id={self.run_id}, name='{self.run_name}', status='{self.status}')>"


class JudgeRun(Base):
    """Represents a complete judge evaluation run grouping multiple evaluations."""
    
    __tablename__ = "judge_runs"
    
    run_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    run_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    judge_model: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Run timing and stats
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    total_scenarios: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    successful_evaluations: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    failed_evaluations: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Metadata and timestamps
    run_metadata: Mapped[Optional[dict]] = mapped_column("metadata", JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    judge_evaluations: Mapped[List["JudgeEvaluation"]] = relationship("JudgeEvaluation", back_populates="judge_run", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index('idx_judge_runs_started_at', 'started_at'),
        Index('idx_judge_runs_judge_model', 'judge_model'),
    )
    
    def __repr__(self) -> str:
        return f"<JudgeRun(id={self.run_id}, judge_model='{self.judge_model}', started_at='{self.started_at}')>"


class JudgeEvaluation(Base):
    """Represents a single scenario evaluation by a judge for multiple models."""
    
    __tablename__ = "judge_evaluations"
    
    evaluation_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    run_id: Mapped[int] = mapped_column(Integer, ForeignKey('judge_runs.run_id', ondelete='CASCADE'), nullable=False, index=True)
    pair_id: Mapped[str] = mapped_column(String(50), ForeignKey('mirror_pairs.pair_id', ondelete='CASCADE'), nullable=False, index=True)
    
    # Judge's overall analysis (removed redundant fields)
    comparative_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Judge's overall analysis
    
    # Evaluation metadata
    evaluation_timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    raw_usage_info: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # Token usage from judge model
    quality_metrics: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # Quality metrics (validity, completeness, etc.)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    judge_run: Mapped["JudgeRun"] = relationship("JudgeRun", back_populates="judge_evaluations")
    mirror_pair: Mapped["MirrorPair"] = relationship("MirrorPair")
    judge_model_evaluations: Mapped[List["JudgeModelEvaluation"]] = relationship("JudgeModelEvaluation", back_populates="judge_evaluation", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index('idx_judge_evaluations_run_id', 'run_id'),
        Index('idx_judge_evaluations_pair_id', 'pair_id'),
        Index('idx_judge_evaluations_timestamp', 'evaluation_timestamp'),
        Index('idx_judge_evaluations_run_pair', 'run_id', 'pair_id'),
    )
    
    def __repr__(self) -> str:
        return f"<JudgeEvaluation(id={self.evaluation_id}, pair_id='{self.pair_id}', run_id={self.run_id})>"


class JudgeModelEvaluation(Base):
    """Represents a judge's evaluation of a single model's responses to both prompts in a mirror pair."""
    
    __tablename__ = "judge_model_evaluations"
    
    model_evaluation_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    evaluation_id: Mapped[int] = mapped_column(Integer, ForeignKey('judge_evaluations.evaluation_id', ondelete='CASCADE'), nullable=False, index=True)
    model_id: Mapped[int] = mapped_column(Integer, ForeignKey('ai_models.model_id'), nullable=False, index=True)
    
    # Links to actual prompts (required for proper foreign key relationships)
    prompt_a_id: Mapped[int] = mapped_column(Integer, ForeignKey('prompts.prompt_id'), nullable=False)
    prompt_b_id: Mapped[int] = mapped_column(Integer, ForeignKey('prompts.prompt_id'), nullable=False)
    
    # Prompt A scores and analysis
    scores_a_complicity: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    scores_a_firmness: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    scores_a_authority: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    scores_a_outcome_focus: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    rationale_a: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    output_a_content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Prompt B scores and analysis
    scores_b_complicity: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    scores_b_firmness: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    scores_b_authority: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    scores_b_outcome_focus: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    rationale_b: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    output_b_content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    judge_evaluation: Mapped["JudgeEvaluation"] = relationship("JudgeEvaluation", back_populates="judge_model_evaluations")
    ai_model: Mapped["AIModel"] = relationship("AIModel")
    prompt_a: Mapped["Prompt"] = relationship("Prompt", foreign_keys=[prompt_a_id])
    prompt_b: Mapped["Prompt"] = relationship("Prompt", foreign_keys=[prompt_b_id])
    
    # Indexes
    __table_args__ = (
        Index('idx_judge_model_evals_eval_id', 'evaluation_id'),
        Index('idx_judge_model_evals_model', 'model_id'),
        Index('idx_judge_model_evals_eval_model', 'evaluation_id', 'model_id'),
    )
    
    def __repr__(self) -> str:
        return f"<JudgeModelEvaluation(id={self.model_evaluation_id}, model_id={self.model_id}, eval_id={self.evaluation_id})>"


# === AVM PROTOCOL FRAMEWORK MODELS ===

class AVMCategory(Base):
    """AVM archetype categories (Amoral Tool, Moral Arbiter, Ethical Guardian)."""
    
    __tablename__ = "avm_categories"
    
    category_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    category_name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    archetypes: Mapped[List["AVMArchetype"]] = relationship("AVMArchetype", back_populates="category")
    
    def __repr__(self) -> str:
        return f"<AVMCategory(id={self.category_id}, name='{self.category_name}')>"


class AVMArchetype(Base):
    """AVM personality archetypes with behavioral signatures and risk profiles."""
    
    __tablename__ = "avm_archetypes"
    
    archetype_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    archetype_code: Mapped[str] = mapped_column(String(10), unique=True, nullable=False, index=True)
    archetype_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    category_id: Mapped[int] = mapped_column(Integer, ForeignKey("avm_categories.category_id"), nullable=False)
    
    # Core archetype data
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    behavioral_signature: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    risk_profile: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    trigger_conditions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    human_analogy: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    research_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # JSON fields for complex data
    contextual_appropriateness: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    ideal_scenarios: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    problematic_scenarios: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    critical_failures: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    
    # Metadata
    severity_sensitivity: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    category: Mapped["AVMCategory"] = relationship("AVMCategory", back_populates="archetypes")
    
    def __repr__(self) -> str:
        return f"<AVMArchetype(id={self.archetype_id}, code='{self.archetype_code}', name='{self.archetype_name}')>"
