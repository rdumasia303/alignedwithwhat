"""
Analytics and compound test result endpoints for frontend and judge LLM analysis.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, distinct, cast, Integer, text
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.core.config import get_db
from app.database.models import (
    MirrorPair as MirrorPairModel,
    Prompt as PromptModel, 
    ModelResponse as ModelResponseModel,
    AIModel as AIModelModel,
    ExecutionRun as ExecutionRunModel,
    Persona as PersonaModel
)
from app.database.schemas import (
    MirrorPair, Prompt, ModelResponse, AIModel, ExecutionRun
)
from pydantic import BaseModel, Field

router = APIRouter(tags=["analytics"])


# Response schemas for compound test results
class CompactModel(BaseModel):
    """Compact model information for compound results."""
    openrouter_id: str
    canonical_slug: str
    name: str

class CompactResponse(BaseModel):
    """Compact response information for compound results."""
    prompt_id: int
    ai_model_id: int
    output_text: Optional[str] = None
    response_id: int

class ModelTestResult(BaseModel):
    """Test results for a specific model on a mirror pair."""
    model: CompactModel
    prompt_a_response: Optional[CompactResponse] = None
    prompt_b_response: Optional[CompactResponse] = None

class CompoundTestResult(BaseModel):
    """Complete test result for a mirror pair showing all model responses."""
    pair_id: str
    prompt_a_text: str
    prompt_b_text: str
    model_results: List[ModelTestResult]


class ModelPerformanceSummary(BaseModel):
    """Performance summary for a model across all tests."""
    model: AIModel
    total_responses: int
    successful_responses: int
    failed_responses: int
    success_rate: float
    avg_response_time_ms: Optional[float] = None
    avg_total_tokens: Optional[float] = None
    avg_response_length: Optional[float] = None
    
    class Config:
        from_attributes = True


class PairTestingSummary(BaseModel):
    """Testing summary for a specific mirror pair."""
    pair_id: str
    mirror_pair: MirrorPair
    total_models: int
    models_tested: int
    total_responses: int
    successful_responses: int
    testing_completion_rate: float
    last_test_date: Optional[datetime] = None
    
    class Config:
        from_attributes = True


@router.get("/compound-test-result/{pair_id}", response_model=CompoundTestResult)
async def get_compound_test_result(
    pair_id: str,
    persona_id: Optional[int] = None,
    execution_run_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Get complete test results for a mirror pair, including both prompts and all model responses.
    This is the main endpoint for judge LLM analysis - returns lean, token-efficient data.
    """
    # Build query for prompts
    prompt_query = db.query(PromptModel).filter(PromptModel.pair_id == pair_id)
    
    if persona_id:
        prompt_query = prompt_query.filter(PromptModel.persona_id == persona_id)
    
    prompts = prompt_query.all()
    
    if not prompts:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No prompts found for pair {pair_id}" + (f" with persona {persona_id}" if persona_id else "")
        )
    
    # Separate A and B prompts
    prompt_a = next((p for p in prompts if p.prompt_type == 'A'), None)
    prompt_b = next((p for p in prompts if p.prompt_type == 'B'), None)
    
    if not prompt_a or not prompt_b:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Missing A or B prompt for pair {pair_id}"
        )
    
    # Build query for responses
    response_query = db.query(ModelResponseModel).options(
        joinedload(ModelResponseModel.ai_model)
    ).filter(
        ModelResponseModel.prompt_id.in_([prompt_a.prompt_id, prompt_b.prompt_id])
    )
    
    if execution_run_id:
        response_query = response_query.filter(ModelResponseModel.execution_run_id == execution_run_id)
    
    responses = response_query.all()
    
    # Group responses by model
    model_responses = {}
    for response in responses:
        model_id = response.ai_model_id
        if model_id not in model_responses:
            model_responses[model_id] = {
                'model': response.ai_model,
                'prompt_a_response': None,
                'prompt_b_response': None
            }
        
        # Create compact response object
        compact_response = CompactResponse(
            prompt_id=response.prompt_id,
            ai_model_id=response.ai_model_id,
            output_text=response.output_text,
            response_id=response.response_id
        )
        
        if response.prompt_id == prompt_a.prompt_id:
            model_responses[model_id]['prompt_a_response'] = compact_response
        elif response.prompt_id == prompt_b.prompt_id:
            model_responses[model_id]['prompt_b_response'] = compact_response
    
    # Create model test results with compact data
    model_results = []
    for data in model_responses.values():
        compact_model = CompactModel(
            openrouter_id=data['model'].openrouter_id,
            canonical_slug=data['model'].canonical_slug,
            name=data['model'].name
        )
        
        model_results.append(ModelTestResult(
            model=compact_model,
            prompt_a_response=data['prompt_a_response'],
            prompt_b_response=data['prompt_b_response']
        ))
    
    return CompoundTestResult(
        pair_id=pair_id,
        prompt_a_text=prompt_a.prompt_text,
        prompt_b_text=prompt_b.prompt_text,
        model_results=model_results
    )


@router.get("/model-performance", response_model=List[ModelPerformanceSummary])
async def get_model_performance_summary(
    execution_run_id: Optional[int] = None,
    model_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get performance summary for all models or a specific model."""
    
    # Base query
    query = db.query(
        ModelResponseModel.ai_model_id,
        func.count(ModelResponseModel.response_id).label('total_responses'),
        func.sum(cast(ModelResponseModel.success, Integer)).label('successful_responses'),
        func.avg(ModelResponseModel.duration_ms).label('avg_response_time_ms'),
        func.avg(ModelResponseModel.total_tokens).label('avg_total_tokens'),
        func.avg(ModelResponseModel.response_length).label('avg_response_length')
    ).group_by(ModelResponseModel.ai_model_id)
    
    if execution_run_id:
        query = query.filter(ModelResponseModel.execution_run_id == execution_run_id)
    
    if model_id:
        query = query.filter(ModelResponseModel.ai_model_id == model_id)
    
    results = query.all()
    
    # Get model details
    model_ids = [r.ai_model_id for r in results]
    models = {
        model.model_id: model 
        for model in db.query(AIModelModel).filter(AIModelModel.model_id.in_(model_ids)).all()
    }
    
    summaries = []
    for result in results:
        model = models.get(result.ai_model_id)
        if not model:
            continue
            
        successful = result.successful_responses or 0
        total = result.total_responses or 0
        failed = total - successful
        success_rate = (successful / total * 100) if total > 0 else 0
        
        summaries.append(ModelPerformanceSummary(
            model=model,
            total_responses=total,
            successful_responses=successful,
            failed_responses=failed,
            success_rate=success_rate,
            avg_response_time_ms=result.avg_response_time_ms,
            avg_total_tokens=result.avg_total_tokens,
            avg_response_length=result.avg_response_length
        ))
    
    return sorted(summaries, key=lambda x: x.total_responses, reverse=True)


@router.get("/pair-testing-summary", response_model=List[PairTestingSummary])
async def get_pair_testing_summary(
    execution_run_id: Optional[int] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get testing summary for all mirror pairs."""
    
    # Get total model count
    total_models = db.query(func.count(AIModelModel.model_id)).filter(
        AIModelModel.is_active == True
    ).scalar()
    
    # Base query for responses per pair
    response_query = db.query(
        PromptModel.pair_id,
        func.count(distinct(ModelResponseModel.ai_model_id)).label('models_tested'),
        func.count(ModelResponseModel.response_id).label('total_responses'),
        func.sum(cast(ModelResponseModel.success, Integer)).label('successful_responses'),
        func.max(ModelResponseModel.execution_timestamp).label('last_test_date')
    ).join(
        ModelResponseModel, PromptModel.prompt_id == ModelResponseModel.prompt_id
    ).group_by(PromptModel.pair_id)
    
    if execution_run_id:
        response_query = response_query.filter(ModelResponseModel.execution_run_id == execution_run_id)
    
    response_results = response_query.limit(limit).all()
    
    # Get mirror pair details
    pair_ids = [r.pair_id for r in response_results]
    mirror_pairs = {
        pair.pair_id: pair 
        for pair in db.query(MirrorPairModel).filter(MirrorPairModel.pair_id.in_(pair_ids)).all()
    }
    
    summaries = []
    for result in response_results:
        mirror_pair = mirror_pairs.get(result.pair_id)
        if not mirror_pair:
            continue
            
        models_tested = result.models_tested or 0
        completion_rate = (models_tested / total_models * 100) if total_models > 0 else 0
        
        summaries.append(PairTestingSummary(
            pair_id=result.pair_id,
            mirror_pair=mirror_pair,
            total_models=total_models,
            models_tested=models_tested,
            total_responses=result.total_responses or 0,
            successful_responses=result.successful_responses or 0,
            testing_completion_rate=completion_rate,
            last_test_date=result.last_test_date
        ))
    
    return sorted(summaries, key=lambda x: x.testing_completion_rate, reverse=True)


@router.get("/execution-run-summary/{run_id}")
async def get_execution_run_summary(run_id: int, db: Session = Depends(get_db)):
    """Get detailed summary of an execution run."""
    
    # Get execution run
    execution_run = db.query(ExecutionRunModel).filter(
        ExecutionRunModel.run_id == run_id
    ).first()
    
    if not execution_run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Execution run {run_id} not found"
        )
    
    # Get response statistics
    response_stats = db.query(
        func.count(ModelResponseModel.response_id).label('total_responses'),
        func.sum(cast(ModelResponseModel.success, Integer)).label('successful_responses'),
        func.count(distinct(ModelResponseModel.ai_model_id)).label('models_used'),
        func.count(distinct(ModelResponseModel.prompt_id)).label('prompts_tested'),
        func.avg(ModelResponseModel.duration_ms).label('avg_duration_ms'),
        func.sum(ModelResponseModel.total_tokens).label('total_tokens_used')
    ).filter(ModelResponseModel.execution_run_id == run_id).first()
    
    # Get pair statistics
    pair_stats = db.query(
        func.count(distinct(PromptModel.pair_id)).label('pairs_tested')
    ).join(
        ModelResponseModel, PromptModel.prompt_id == ModelResponseModel.prompt_id
    ).filter(ModelResponseModel.execution_run_id == run_id).first()
    
    successful = response_stats.successful_responses or 0
    total = response_stats.total_responses or 0
    failed = total - successful
    
    return {
        "execution_run": execution_run,
        "statistics": {
            "total_responses": total,
            "successful_responses": successful,
            "failed_responses": failed,
            "success_rate": (successful / total * 100) if total > 0 else 0,
            "models_used": response_stats.models_used or 0,
            "prompts_tested": response_stats.prompts_tested or 0,
            "pairs_tested": pair_stats.pairs_tested or 0,
            "avg_duration_ms": response_stats.avg_duration_ms,
            "total_tokens_used": response_stats.total_tokens_used or 0
        }
    }


@router.get("/comparison-data/{pair_id}")
async def get_comparison_data(
    pair_id: str,
    persona_id: Optional[int] = None,
    execution_run_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Get data optimized for side-by-side comparison visualization.
    Returns prompt A and B responses for each model in an easy-to-display format.
    """
    
    # Get compound test result
    compound_result = await get_compound_test_result(
        pair_id=pair_id,
        persona_id=persona_id,
        execution_run_id=execution_run_id,
        db=db
    )
    
    # Transform for comparison display
    comparison_data = []
    for model_result in compound_result.model_results:
        comparison_data.append({
            "model": {
                "name": model_result.model.name,
                "openrouter_id": model_result.model.openrouter_id,
                "model_id": model_result.model.model_id
            },
            "prompt_a": {
                "text": compound_result.prompt_a_text,
                "response": {
                    "output_text": model_result.prompt_a_response.output_text if model_result.prompt_a_response else None,
                    "success": model_result.prompt_a_response.success if model_result.prompt_a_response else None,
                    "duration_ms": model_result.prompt_a_response.duration_ms if model_result.prompt_a_response else None,
                    "total_tokens": model_result.prompt_a_response.total_tokens if model_result.prompt_a_response else None,
                } if model_result.prompt_a_response else None
            },
            "prompt_b": {
                "text": compound_result.prompt_b_text,
                "response": {
                    "output_text": model_result.prompt_b_response.output_text if model_result.prompt_b_response else None,
                    "success": model_result.prompt_b_response.success if model_result.prompt_b_response else None,
                    "duration_ms": model_result.prompt_b_response.duration_ms if model_result.prompt_b_response else None,
                    "total_tokens": model_result.prompt_b_response.total_tokens if model_result.prompt_b_response else None,
                } if model_result.prompt_b_response else None
            },
            "has_both_responses": model_result.prompt_a_response is not None and model_result.prompt_b_response is not None
        })
    
    return {
        "pair_id": pair_id,
        "mirror_pair": compound_result.mirror_pair,
        "persona_name": compound_result.persona_name,
        "comparison_data": comparison_data,
        "summary": {
            "total_models": len(comparison_data),
            "models_with_both_responses": sum(1 for item in comparison_data if item["has_both_responses"]),
            "completion_rate": (sum(1 for item in comparison_data if item["has_both_responses"]) / len(comparison_data) * 100) if comparison_data else 0
        }
    }


@router.get("/search-pairs")
async def search_pairs(
    q: Optional[str] = None,
    domain_id: Optional[int] = None,
    region_id: Optional[int] = None,
    has_responses: Optional[bool] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Search mirror pairs with various filters."""
    
    query = db.query(MirrorPairModel)
    
    if q:
        search_term = f"%{q}%"
        query = query.filter(
            db.or_(
                MirrorPairModel.pair_id.ilike(search_term),
                MirrorPairModel.conflict_text.ilike(search_term)
            )
        )
    
    if domain_id:
        query = query.filter(MirrorPairModel.domain_id == domain_id)
    
    if region_id:
        query = query.filter(MirrorPairModel.region_id == region_id)
    
    if has_responses is not None:
        if has_responses:
            # Only pairs with responses
            query = query.join(PromptModel).join(ModelResponseModel)
        else:
            # Only pairs without responses
            query = query.filter(
                ~MirrorPairModel.pair_id.in_(
                    db.query(PromptModel.pair_id).join(ModelResponseModel).distinct()
                )
            )
    
    pairs = query.distinct().limit(limit).all()
    
    return {
        "pairs": pairs,
        "total": len(pairs),
        "filters_applied": {
            "search_query": q,
            "domain_id": domain_id,
            "region_id": region_id,
            "has_responses": has_responses
        }
    }


@router.get("/overall-statistics")
async def get_overall_statistics(db: Session = Depends(get_db)):
    """Get overall system statistics for dashboard."""
    
    # Count basic entities
    total_pairs = db.query(func.count(MirrorPairModel.pair_id)).scalar()
    total_prompts = db.query(func.count(PromptModel.prompt_id)).scalar()
    total_models = db.query(func.count(AIModelModel.model_id)).filter(AIModelModel.is_active == True).scalar()
    total_responses = db.query(func.count(ModelResponseModel.response_id)).scalar()
    successful_responses = db.query(func.count(ModelResponseModel.response_id)).filter(ModelResponseModel.success == True).scalar()
    
    # Count pairs with any responses
    pairs_with_responses = db.query(func.count(distinct(PromptModel.pair_id))).join(ModelResponseModel).scalar()
    
    # Get recent activity
    recent_responses = db.query(func.count(ModelResponseModel.response_id)).filter(
        ModelResponseModel.created_at >= text("now() - interval '7 days'")
    ).scalar()
    
    # Calculate coverage
    coverage_rate = (pairs_with_responses / total_pairs * 100) if total_pairs > 0 else 0
    success_rate = (successful_responses / total_responses * 100) if total_responses > 0 else 0
    
    return {
        "entities": {
            "total_mirror_pairs": total_pairs,
            "total_prompts": total_prompts,
            "total_ai_models": total_models,
            "total_responses": total_responses,
            "successful_responses": successful_responses,
            "failed_responses": total_responses - successful_responses,
            "pairs_with_responses": pairs_with_responses
        },
        "rates": {
            "coverage_rate": coverage_rate,
            "success_rate": success_rate
        },
        "recent_activity": {
            "responses_last_7_days": recent_responses
        }
    }


@router.get("/model-comparison/{model_id_1}/{model_id_2}")
async def compare_models(
    model_id_1: int,
    model_id_2: int,
    execution_run_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Compare performance between two specific models."""
    
    # Verify models exist
    model_1 = db.query(AIModelModel).filter(AIModelModel.model_id == model_id_1).first()
    model_2 = db.query(AIModelModel).filter(AIModelModel.model_id == model_id_2).first()
    
    if not model_1 or not model_2:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="One or both models not found"
        )
    
    # Get performance data for both models
    model_1_perf = await get_model_performance_summary(
        execution_run_id=execution_run_id,
        model_id=model_id_1,
        db=db
    )
    
    model_2_perf = await get_model_performance_summary(
        execution_run_id=execution_run_id,
        model_id=model_id_2,
        db=db
    )
    
    # Get head-to-head comparison data
    # Find prompts where both models have responses
    query = db.query(
        PromptModel.prompt_id,
        PromptModel.pair_id,
        PromptModel.prompt_type
    ).join(
        ModelResponseModel, PromptModel.prompt_id == ModelResponseModel.prompt_id
    ).filter(
        ModelResponseModel.ai_model_id.in_([model_id_1, model_id_2])
    )
    
    if execution_run_id:
        query = query.filter(ModelResponseModel.execution_run_id == execution_run_id)
    
    # Group by prompt to find where both models responded
    prompt_counts = {}
    for prompt_id, pair_id, prompt_type in query.all():
        if prompt_id not in prompt_counts:
            prompt_counts[prompt_id] = {"pair_id": pair_id, "prompt_type": prompt_type, "models": set()}
        
        # Get model IDs for this prompt
        models_for_prompt = db.query(ModelResponseModel.ai_model_id).filter(
            ModelResponseModel.prompt_id == prompt_id,
            ModelResponseModel.ai_model_id.in_([model_id_1, model_id_2])
        ).all()
        
        for model_id, in models_for_prompt:
            prompt_counts[prompt_id]["models"].add(model_id)
    
    # Count head-to-head prompts
    head_to_head_prompts = [
        prompt_data for prompt_data in prompt_counts.values()
        if len(prompt_data["models"]) == 2
    ]
    
    return {
        "model_1": model_1_perf[0] if model_1_perf else None,
        "model_2": model_2_perf[0] if model_2_perf else None,
        "head_to_head": {
            "total_prompts_both_responded": len(head_to_head_prompts),
            "unique_pairs_both_responded": len(set(p["pair_id"] for p in head_to_head_prompts))
        }
    }


@router.get("/random-pair-for-review")
async def get_random_pair_for_review(
    has_responses: bool = True,
    min_models: int = 1,
    db: Session = Depends(get_db)
):
    """Get a random mirror pair for manual review/judging."""
    
    query = db.query(MirrorPairModel)
    
    if has_responses:
        # Only pairs with responses
        subquery = db.query(PromptModel.pair_id).join(ModelResponseModel).group_by(
            PromptModel.pair_id
        ).having(
            func.count(distinct(ModelResponseModel.ai_model_id)) >= min_models
        ).subquery()
        
        query = query.filter(MirrorPairModel.pair_id.in_(subquery))
    
    # Get random pair
    total_count = query.count()
    if total_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No pairs found matching criteria"
        )
    
    import random
    random_offset = random.randint(0, total_count - 1)
    random_pair = query.offset(random_offset).first()
    
    # Get compound test result for this pair
    compound_result = await get_compound_test_result(
        pair_id=random_pair.pair_id,
        db=db
    )
    
    return compound_result


@router.get("/pairs-ready-for-judging")
async def get_pairs_ready_for_judging(
    min_models: int = 5,
    limit: int = 20,
    execution_run_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get mirror pairs that have sufficient model responses for judge evaluation."""
    
    # Find pairs with enough model responses for both A and B prompts
    base_query = db.query(PromptModel.pair_id).join(ModelResponseModel).filter(
        ModelResponseModel.success == True
    )
    
    if execution_run_id:
        base_query = base_query.filter(ModelResponseModel.execution_run_id == execution_run_id)
    
    # Group by pair and prompt type, count distinct models
    prompt_model_counts = base_query.group_by(
        PromptModel.pair_id, PromptModel.prompt_type
    ).having(
        func.count(distinct(ModelResponseModel.ai_model_id)) >= min_models
    ).with_entities(
        PromptModel.pair_id,
        PromptModel.prompt_type,
        func.count(distinct(ModelResponseModel.ai_model_id)).label('model_count')
    ).subquery()
    
    # Find pairs that have sufficient responses for both A and B
    pairs_with_sufficient_responses = db.query(prompt_model_counts.c.pair_id).group_by(
        prompt_model_counts.c.pair_id
    ).having(
        func.count(prompt_model_counts.c.prompt_type) >= 2  # Both A and B
    ).limit(limit).all()
    
    pair_ids = [pair_id for pair_id, in pairs_with_sufficient_responses]
    
    if not pair_ids:
        return {
            "pairs": [],
            "total": 0,
            "criteria": {
                "min_models_per_prompt": min_models,
                "execution_run_id": execution_run_id
            }
        }
    
    # Get full mirror pair details
    mirror_pairs = db.query(MirrorPairModel).filter(
        MirrorPairModel.pair_id.in_(pair_ids)
    ).all()
    
    # Get response counts for each pair
    result_pairs = []
    for pair in mirror_pairs:
        # Count responses for this pair
        response_counts = db.query(
            PromptModel.prompt_type,
            func.count(distinct(ModelResponseModel.ai_model_id)).label('model_count')
        ).join(ModelResponseModel).filter(
            PromptModel.pair_id == pair.pair_id,
            ModelResponseModel.success == True
        ).group_by(PromptModel.prompt_type).all()
        
        counts_dict = {prompt_type: count for prompt_type, count in response_counts}
        
        result_pairs.append({
            "mirror_pair": pair,
            "response_counts": {
                "prompt_a_models": counts_dict.get('A', 0),
                "prompt_b_models": counts_dict.get('B', 0),
                "total_unique_models": len(set(
                    [model_id for model_id, in db.query(distinct(ModelResponseModel.ai_model_id)).join(PromptModel).filter(
                        PromptModel.pair_id == pair.pair_id,
                        ModelResponseModel.success == True
                    ).all()]
                ))
            }
        })
    
    return {
        "pairs": result_pairs,
        "total": len(result_pairs),
        "criteria": {
            "min_models_per_prompt": min_models,
            "execution_run_id": execution_run_id
        }
    }
