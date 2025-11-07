"""Initial schema - complete AlignedWithWhat database

Revision ID: 001_initial_schema
Revises: 
Create Date: 2025-11-01 00:00:00.000000

This is the definitive initial schema combining all tables needed for the
AlignedWithWhat AI evaluation platform. No backwards compatibility needed.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

# revision identifiers, used by Alembic.
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Reference tables
    op.create_table('authority_refs',
        sa.Column('authority_ref_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('authority_ref_text', sa.String(length=500), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('authority_ref_id')
    )
    op.create_index(op.f('ix_authority_refs_authority_ref_text'), 'authority_refs', ['authority_ref_text'], unique=True)

    op.create_table('domains',
        sa.Column('domain_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('domain_name', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('domain_id')
    )
    op.create_index(op.f('ix_domains_domain_name'), 'domains', ['domain_name'], unique=True)

    op.create_table('harm_categories',
        sa.Column('harm_category_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('harm_category_name', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('harm_category_id')
    )
    op.create_index(op.f('ix_harm_categories_harm_category_name'), 'harm_categories', ['harm_category_name'], unique=True)

    op.create_table('personas',
        sa.Column('persona_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('persona_name', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('persona_id')
    )
    op.create_index(op.f('ix_personas_persona_name'), 'personas', ['persona_name'], unique=True)

    op.create_table('power_dynamics',
        sa.Column('power_dynamic_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('power_dynamic_name', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('power_dynamic_id')
    )
    op.create_index(op.f('ix_power_dynamics_power_dynamic_name'), 'power_dynamics', ['power_dynamic_name'], unique=True)

    op.create_table('regions',
        sa.Column('region_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('region_name', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('region_id')
    )
    op.create_index(op.f('ix_regions_region_name'), 'regions', ['region_name'], unique=True)

    op.create_table('scenario_types',
        sa.Column('scenario_type_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('scenario_type_name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('optimal_archetypes', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('scenario_type_id')
    )
    op.create_index(op.f('ix_scenario_types_scenario_type_name'), 'scenario_types', ['scenario_type_name'], unique=True)

    # Severity levels table
    op.create_table('severity_levels',
        sa.Column('severity_level_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('severity_level_name', sa.String(length=50), nullable=False),
        sa.Column('severity_weight', sa.Integer(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('scaling_guidance', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('severity_level_id')
    )
    op.create_index(op.f('ix_severity_levels_severity_level_name'), 'severity_levels', ['severity_level_name'], unique=True)

    # AVM Protocol tables
    op.create_table('avm_categories',
        sa.Column('category_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('category_name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('category_id')
    )
    op.create_index(op.f('ix_avm_categories_category_name'), 'avm_categories', ['category_name'], unique=True)

    op.create_table('avm_archetypes',
        sa.Column('archetype_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('archetype_code', sa.String(length=10), nullable=False),
        sa.Column('archetype_name', sa.String(length=100), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('behavioral_signature', sa.Text(), nullable=True),
        sa.Column('risk_profile', sa.Text(), nullable=True),
        sa.Column('trigger_conditions', sa.Text(), nullable=True),
        sa.Column('human_analogy', sa.Text(), nullable=True),
        sa.Column('research_notes', sa.Text(), nullable=True),
        sa.Column('contextual_appropriateness', sa.JSON(), nullable=True),
        sa.Column('severity_sensitivity', sa.Text(), nullable=True),
        sa.Column('ideal_scenarios', sa.JSON(), nullable=True),
        sa.Column('problematic_scenarios', sa.JSON(), nullable=True),
        sa.Column('critical_failures', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['category_id'], ['avm_categories.category_id'], ),
        sa.PrimaryKeyConstraint('archetype_id')
    )
    op.create_index(op.f('ix_avm_archetypes_archetype_code'), 'avm_archetypes', ['archetype_code'], unique=True)

    # AI Models table
    op.create_table('ai_models',
        sa.Column('model_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('openrouter_id', sa.String(length=255), nullable=False),
        sa.Column('canonical_slug', sa.String(length=255), nullable=False),
        sa.Column('name', sa.String(length=500), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_timestamp', sa.Integer(), nullable=True),
        sa.Column('context_length', sa.Integer(), nullable=True),
        sa.Column('max_completion_tokens', sa.Integer(), nullable=True),
        sa.Column('is_moderated', sa.Boolean(), nullable=True),
        sa.Column('prompt_price', sa.String(length=20), nullable=True),
        sa.Column('completion_price', sa.String(length=20), nullable=True),
        sa.Column('request_price', sa.String(length=20), nullable=True),
        sa.Column('image_price', sa.String(length=20), nullable=True),
        sa.Column('architecture', sa.JSON(), nullable=True),
        sa.Column('supported_parameters', sa.JSON(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('last_updated', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('model_id')
    )
    op.create_index(op.f('ix_ai_models_openrouter_id'), 'ai_models', ['openrouter_id'], unique=True)
    op.create_index(op.f('ix_ai_models_canonical_slug'), 'ai_models', ['canonical_slug'], unique=True)
    op.create_index('idx_ai_model_active', 'ai_models', ['is_active'], unique=False)
    op.create_index('idx_ai_model_created', 'ai_models', ['created_timestamp'], unique=False)

    # Execution runs table
    op.create_table('execution_runs',
        sa.Column('run_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('run_name', sa.String(length=255), nullable=True),
        sa.Column('run_description', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, default='running'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('run_id')
    )
    op.create_index('idx_execution_run_status', 'execution_runs', ['status'], unique=False)    
    op.create_index('idx_execution_run_name', 'execution_runs', ['run_name'], unique=False)

    # Mirror pairs table
    op.create_table('mirror_pairs',
        sa.Column('pair_id', sa.String(length=50), nullable=False),
        sa.Column('domain_id', sa.Integer(), nullable=False),
        sa.Column('region_id', sa.Integer(), nullable=False),
        sa.Column('conflict_text', sa.Text(), nullable=False),
        sa.Column('full_description', sa.Text(), nullable=True),
        sa.Column('scenario_type_id', sa.Integer(), nullable=False),
        sa.Column('power_dynamic_id', sa.Integer(), nullable=True),
        sa.Column('severity_level_id', sa.Integer(), nullable=True),
        sa.Column('weaponized_assistance', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['domain_id'], ['domains.domain_id'], ),
        sa.ForeignKeyConstraint(['power_dynamic_id'], ['power_dynamics.power_dynamic_id'], ),
        sa.ForeignKeyConstraint(['region_id'], ['regions.region_id'], ),
        sa.ForeignKeyConstraint(['scenario_type_id'], ['scenario_types.scenario_type_id'], ),
        sa.ForeignKeyConstraint(['severity_level_id'], ['severity_levels.severity_level_id'], ),
        sa.PrimaryKeyConstraint('pair_id')
    )
    op.create_index('idx_mirror_pair_created', 'mirror_pairs', ['created_at'], unique=False)
    op.create_index('idx_mirror_pair_domain', 'mirror_pairs', ['domain_id'], unique=False)
    op.create_index('idx_mirror_pair_region', 'mirror_pairs', ['region_id'], unique=False)
    op.create_index('idx_mirror_pair_scenario_type', 'mirror_pairs', ['scenario_type_id'], unique=False)
    op.create_index('idx_mirror_pair_severity', 'mirror_pairs', ['severity_level_id'], unique=False)
    op.create_index('idx_mirror_pair_weaponized', 'mirror_pairs', ['weaponized_assistance'], unique=False)

    # Junction tables
    op.create_table('pair_authority_refs',
        sa.Column('pair_id', sa.String(length=50), nullable=False),
        sa.Column('authority_ref_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['authority_ref_id'], ['authority_refs.authority_ref_id'], ),
        sa.ForeignKeyConstraint(['pair_id'], ['mirror_pairs.pair_id'], ),
        sa.PrimaryKeyConstraint('pair_id', 'authority_ref_id')
    )

    op.create_table('pair_harm_categories',
        sa.Column('pair_id', sa.String(length=50), nullable=False),
        sa.Column('harm_category_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['harm_category_id'], ['harm_categories.harm_category_id'], ),
        sa.ForeignKeyConstraint(['pair_id'], ['mirror_pairs.pair_id'], ),
        sa.PrimaryKeyConstraint('pair_id', 'harm_category_id')
    )

    # Prompts table
    op.create_table('prompts',
        sa.Column('prompt_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('pair_id', sa.String(length=50), nullable=False),
        sa.Column('persona_id', sa.Integer(), nullable=False),
        sa.Column('prompt_type', sa.String(length=1), nullable=False),
        sa.Column('prompt_text', sa.Text(), nullable=False),
        sa.Column('redacted_prompt', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['pair_id'], ['mirror_pairs.pair_id'], ),
        sa.ForeignKeyConstraint(['persona_id'], ['personas.persona_id'], ),
        sa.PrimaryKeyConstraint('prompt_id')
    )
    op.create_index('idx_prompt_pair', 'prompts', ['pair_id'], unique=False)
    op.create_index('idx_prompt_pair_type', 'prompts', ['pair_id', 'prompt_type'], unique=False)
    op.create_index('idx_prompt_persona', 'prompts', ['persona_id'], unique=False)
    op.create_index('idx_prompt_type', 'prompts', ['prompt_type'], unique=False)

    # Model responses table
    op.create_table('model_responses',
        sa.Column('response_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('prompt_id', sa.Integer(), nullable=False),
        sa.Column('ai_model_id', sa.Integer(), nullable=True),
        sa.Column('execution_run_id', sa.Integer(), nullable=True),
        sa.Column('execution_timestamp', sa.DateTime(timezone=True), nullable=True),
        sa.Column('success', sa.Boolean(), nullable=True, default=False),
        sa.Column('duration_ms', sa.Integer(), nullable=True),
        sa.Column('total_tokens', sa.Integer(), nullable=True),
        sa.Column('prompt_tokens', sa.Integer(), nullable=True),
        sa.Column('completion_tokens', sa.Integer(), nullable=True),
        sa.Column('output_text', sa.Text(), nullable=True),
        sa.Column('response_length', sa.Integer(), nullable=True),
        sa.Column('redacted_result', sa.Text(), nullable=True),
        sa.Column('provider', sa.String(length=100), nullable=True),
        sa.Column('model_identifier', sa.String(length=500), nullable=True),
        sa.Column('response_api_id', sa.String(length=100), nullable=True),
        sa.Column('finish_reason', sa.String(length=50), nullable=True),
        sa.Column('full_response_data', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),        
        sa.ForeignKeyConstraint(['prompt_id'], ['prompts.prompt_id'], ),
        sa.ForeignKeyConstraint(['ai_model_id'], ['ai_models.model_id'], ),
        sa.ForeignKeyConstraint(['execution_run_id'], ['execution_runs.run_id'], ),
        sa.PrimaryKeyConstraint('response_id')
    )
    op.create_index('idx_model_response_prompt', 'model_responses', ['prompt_id'], unique=False)
    op.create_index('idx_model_response_ai_model', 'model_responses', ['ai_model_id'], unique=False)
    op.create_index('idx_model_response_execution_run', 'model_responses', ['execution_run_id'], unique=False)
    op.create_index('idx_model_response_execution_timestamp', 'model_responses', ['execution_timestamp'], unique=False)
    op.create_index('idx_model_response_model_identifier', 'model_responses', ['model_identifier'], unique=False)
    op.create_index('idx_model_response_provider', 'model_responses', ['provider'], unique=False)
    op.create_index('idx_model_response_success', 'model_responses', ['success'], unique=False)
    op.create_index('idx_model_response_created', 'model_responses', ['created_at'], unique=False)

    # Judge evaluation tables
    op.create_table('judge_runs',
        sa.Column('run_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('run_name', sa.String(length=255), nullable=True),
        sa.Column('judge_model', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('total_scenarios', sa.Integer(), nullable=True),
        sa.Column('successful_evaluations', sa.Integer(), nullable=True),
        sa.Column('failed_evaluations', sa.Integer(), nullable=True),
        sa.Column('metadata', JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('run_id')
    )
    op.create_index('idx_judge_runs_started_at', 'judge_runs', ['started_at'], unique=False)
    op.create_index('idx_judge_runs_judge_model', 'judge_runs', ['judge_model'], unique=False)

    op.create_table('judge_evaluations',
        sa.Column('evaluation_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('run_id', sa.Integer(), nullable=False),
        sa.Column('pair_id', sa.String(length=50), nullable=False),
        sa.Column('comparative_summary', sa.Text(), nullable=True),
        sa.Column('evaluation_timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('raw_usage_info', JSONB(), nullable=True),
        sa.Column('quality_metrics', JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['run_id'], ['judge_runs.run_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['pair_id'], ['mirror_pairs.pair_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('evaluation_id')
    )
    op.create_index('idx_judge_evaluations_run_id', 'judge_evaluations', ['run_id'], unique=False)
    op.create_index('idx_judge_evaluations_pair_id', 'judge_evaluations', ['pair_id'], unique=False)
    op.create_index('idx_judge_evaluations_timestamp', 'judge_evaluations', ['evaluation_timestamp'], unique=False)
    op.create_index('idx_judge_evaluations_run_pair', 'judge_evaluations', ['run_id', 'pair_id'], unique=False)

    op.create_table('judge_model_evaluations',
        sa.Column('model_evaluation_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('evaluation_id', sa.Integer(), nullable=False),
        sa.Column('model_id', sa.Integer(), nullable=False),
        sa.Column('prompt_a_id', sa.Integer(), nullable=False),
        sa.Column('prompt_b_id', sa.Integer(), nullable=False),
        sa.Column('scores_a_complicity', sa.Float(), nullable=True),
        sa.Column('scores_a_firmness', sa.Float(), nullable=True),
        sa.Column('scores_a_authority', sa.Float(), nullable=True),
        sa.Column('scores_a_outcome_focus', sa.Float(), nullable=True),
        sa.Column('rationale_a', sa.Text(), nullable=True),
        sa.Column('output_a_content', sa.Text(), nullable=True),
        sa.Column('scores_b_complicity', sa.Float(), nullable=True),
        sa.Column('scores_b_firmness', sa.Float(), nullable=True),
        sa.Column('scores_b_authority', sa.Float(), nullable=True),
        sa.Column('scores_b_outcome_focus', sa.Float(), nullable=True),
        sa.Column('rationale_b', sa.Text(), nullable=True),
        sa.Column('output_b_content', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['evaluation_id'], ['judge_evaluations.evaluation_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['model_id'], ['ai_models.model_id'], ),
        sa.ForeignKeyConstraint(['prompt_a_id'], ['prompts.prompt_id'], ),
        sa.ForeignKeyConstraint(['prompt_b_id'], ['prompts.prompt_id'], ),
        sa.PrimaryKeyConstraint('model_evaluation_id')
    )
    op.create_index('idx_judge_model_evals_eval_id', 'judge_model_evaluations', ['evaluation_id'], unique=False)
    op.create_index('idx_judge_model_evals_model', 'judge_model_evaluations', ['model_id'], unique=False)
    op.create_index('idx_judge_model_evals_eval_model', 'judge_model_evaluations', ['evaluation_id', 'model_id'], unique=False)

    # Add table comments for documentation
    op.execute("COMMENT ON TABLE mirror_pairs IS 'Pairs of scenarios designed to test model bias and consistency'")
    op.execute("COMMENT ON COLUMN prompts.prompt_type IS 'A or B indicating which side of the mirror pair this prompt represents'")    
    op.execute("COMMENT ON TABLE execution_runs IS 'Tracks batch execution runs for reproducibility'")
    op.execute("COMMENT ON COLUMN model_responses.redacted_result IS 'Response text with sensitive content removed'")
    op.execute("COMMENT ON COLUMN prompts.redacted_prompt IS 'Prompt text with sensitive content removed for logging'")
    op.execute("COMMENT ON TABLE judge_runs IS 'Groups all evaluations from a single judge model run'")
    op.execute("COMMENT ON TABLE judge_evaluations IS 'Stores judge analysis of mirror pair scenarios'")
    op.execute("COMMENT ON TABLE judge_model_evaluations IS 'Stores individual model assessments with AVM scores'")


def downgrade() -> None:
    """
    Downgrade drops all tables in reverse dependency order.
    Since this is a fresh start, backwards compatibility is not needed.
    """
    # Judge tables
    op.drop_table('judge_model_evaluations')
    op.drop_table('judge_evaluations')
    op.drop_table('judge_runs')
    
    # Response and prompt tables
    op.drop_table('model_responses')
    op.drop_table('prompts')
    
    # Junction tables
    op.drop_table('pair_harm_categories')
    op.drop_table('pair_authority_refs')
    
    # Main tables
    op.drop_table('mirror_pairs')
    op.drop_table('execution_runs')
    op.drop_table('ai_models')
    
    # AVM tables
    op.drop_table('avm_archetypes')
    op.drop_table('avm_categories')
    
    # Lookup tables
    op.drop_table('severity_levels')
    op.drop_table('scenario_types')
    op.drop_table('regions')
    op.drop_table('power_dynamics')
    op.drop_table('personas')
    op.drop_table('harm_categories')
    op.drop_table('domains')
    op.drop_table('authority_refs')
