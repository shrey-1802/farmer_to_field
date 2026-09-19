"""
Multi-Agent Execution & Advisory Endpoints
BACKEND.md Phases 16 - 25
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.db.models.farm import Farm
from app.db.models.agent import AgentRun, RiskEvent
from app.services.context_service import build_farm_context
from app.agents.orchestrator import MultiAgentOrchestrator
from app.agents.soil_agent import SoilAgent
from app.agents.weather_agent import WeatherAgent
from app.agents.irrigation_agent import IrrigationAgent
from app.agents.nutrient_agent import NutrientAgent
from app.agents.disease_agent import DiseaseAgent
from app.agents.market_agent import MarketAgent

router = APIRouter(prefix="/agents", tags=["Multi-Agent AI Intelligence"])

orchestrator = MultiAgentOrchestrator()
soil_agent = SoilAgent()
weather_agent = WeatherAgent()
irrigation_agent = IrrigationAgent()
nutrient_agent = NutrientAgent()
disease_agent = DiseaseAgent()
market_agent = MarketAgent()


class AgentRunRequest(BaseModel):
    farm_id: str
    field_id: Optional[str] = None
    zone_id: Optional[str] = None


class DiseaseAnalyzeRequest(BaseModel):
    farm_id: Optional[str] = None
    filename: Optional[str] = "crop_leaf.jpg"
    content_type: Optional[str] = "image/jpeg"
    file_size_bytes: Optional[int] = 102400


@router.get("/catalog")
def get_agents_catalog():
    """
    List all active AI domain agents and their operational specifications.
    """
    agents = [
        soil_agent,
        weather_agent,
        irrigation_agent,
        nutrient_agent,
        disease_agent,
        market_agent,
    ]
    return {
        "total_agents": len(agents),
        "agents": [a.get_metadata() for a in agents],
    }


@router.post("/run")
def run_all_agents(
    req: AgentRunRequest,
    db: Session = Depends(get_db),
):
    """
    Run the full Multi-Agent Orchestration cycle for a farm.
    1. Aggregates farm context (IoT, Weather, Growth Stage)
    2. Executes Soil, Weather, Irrigation, Nutrient, and Market agents
    3. Detects and resolves cross-agent conflicts
    4. Generates prioritized, safe actionable advisory
    5. Stores execution history and active risks to database
    """
    farm = db.query(Farm).filter(Farm.id == req.farm_id).first()
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farm '{req.farm_id}' not found",
        )

    context = build_farm_context(
        farm_id=req.farm_id,
        db=db,
        field_id=req.field_id,
        zone_id=req.zone_id,
    )

    result = orchestrator.run_all(context=context, db=db)
    return result


@router.post("/{agent_name}/run")
def run_single_agent(
    agent_name: str,
    req: AgentRunRequest,
    db: Session = Depends(get_db),
):
    """
    Execute a single domain agent directly for granular diagnosis.
    Supported: soil, weather, irrigation, nutrient, market
    """
    farm = db.query(Farm).filter(Farm.id == req.farm_id).first()
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farm '{req.farm_id}' not found",
        )

    context = build_farm_context(
        farm_id=req.farm_id,
        db=db,
        field_id=req.field_id,
        zone_id=req.zone_id,
    )

    agent_map = {
        "soil": soil_agent,
        "weather": weather_agent,
        "irrigation": irrigation_agent,
        "nutrient": nutrient_agent,
        "market": market_agent,
    }

    agent = agent_map.get(agent_name.lower())
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent '{agent_name}' not found. Available: {list(agent_map.keys())}",
        )

    out = agent.execute(context)

    # Persist single run
    try:
        run_record = AgentRun(
            agent_name=out["agent_name"],
            farm_id=req.farm_id,
            field_id=req.field_id,
            zone_id=req.zone_id,
            status=out["status"],
            confidence=out["confidence"],
            output_result=out,
            evidence="\n".join(out.get("evidence", [])),
        )
        db.add(run_record)
        db.commit()
    except Exception:
        db.rollback()

    return out


@router.post("/disease/analyze")
async def analyze_crop_disease(
    farm_id: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    """
    Foliar Disease Diagnostic Pipeline (BACKEND.md Phase 21).
    Accepts crop leaf image upload (JPG, PNG, WEBP), performs validation,
    runs pathology inference, correlates with weather conditions,
    and returns pathogen diagnosis with treatment advice.
    """
    filename = "sample_leaf.jpg"
    content_type = "image/jpeg"
    file_size = 50000

    if file:
        filename = file.filename or "sample.jpg"
        content_type = file.content_type or "image/jpeg"
        content = await file.read()
        file_size = len(content)

        # Validate image format and constraints
        is_valid, err_msg = disease_agent.validate_image(
            filename=filename,
            content_type=content_type,
            file_size=file_size,
        )
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=err_msg,
            )

    # Build context with weather correlation
    context: Dict[str, Any] = {
        "filename": filename,
        "content_type": content_type,
        "file_size": file_size,
    }

    if farm_id:
        farm = db.query(Farm).filter(Farm.id == farm_id).first()
        if farm:
            context = build_farm_context(farm_id=farm_id, db=db)
            context["filename"] = filename

    result = disease_agent.execute(context)
    return result


@router.get("/runs")
def list_agent_runs(
    farm_id: Optional[str] = Query(None),
    agent_name: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """
    Query historical agent deliberation runs.
    """
    query = db.query(AgentRun)
    if farm_id:
        query = query.filter(AgentRun.farm_id == farm_id)
    if agent_name:
        query = query.filter(AgentRun.agent_name.ilike(f"%{agent_name}%"))

    runs = query.order_by(AgentRun.started_at.desc()).limit(limit).all()
    return [
        {
            "id": r.id,
            "agent_name": r.agent_name,
            "farm_id": r.farm_id,
            "field_id": r.field_id,
            "status": r.status,
            "confidence": r.confidence,
            "started_at": r.started_at.isoformat() if r.started_at else None,
            "output_result": r.output_result,
        }
        for r in runs
    ]


@router.get("/risks")
def list_risk_events(
    farm_id: Optional[str] = Query(None),
    is_resolved: Optional[bool] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """
    Query active or resolved risk events identified across all agent runs.
    """
    query = db.query(RiskEvent)
    if farm_id:
        query = query.filter(RiskEvent.farm_id == farm_id)
    if is_resolved is not None:
        query = query.filter(RiskEvent.is_resolved == is_resolved)

    risks = query.order_by(RiskEvent.detected_at.desc()).limit(limit).all()
    return [
        {
            "id": r.id,
            "farm_id": r.farm_id,
            "field_id": r.field_id,
            "risk_type": r.risk_type,
            "severity": r.severity,
            "confidence": r.confidence,
            "title": r.title,
            "description": r.description,
            "evidence": r.evidence,
            "is_resolved": r.is_resolved,
            "detected_at": r.detected_at.isoformat() if r.detected_at else None,
        }
        for r in risks
    ]
