"""
Unified Risk Engine
BACKEND.md Phase 23

- Normalizes risks to 0–100 scale
- Classifies severity: LOW (<30), MEDIUM (30–60), HIGH (60–80), CRITICAL (>80)
- Generates standardized risk records
- Evaluates risk vectors across soil, weather, irrigation, disease, and market
"""

from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.db.models.agent import RiskEvent, RiskSeverity, RiskType


def normalize_risk_score(raw_score: float) -> float:
    """Normalize any raw numeric risk value strictly to 0.0 – 100.0."""
    return round(max(0.0, min(100.0, float(raw_score))), 1)


def score_to_severity(score: float) -> str:
    """Classify 0-100 score into canonical severity tier."""
    if score >= 80.0:
        return RiskSeverity.CRITICAL
    elif score >= 60.0:
        return RiskSeverity.HIGH
    elif score >= 30.0:
        return RiskSeverity.MEDIUM
    else:
        return RiskSeverity.LOW


class RiskEngine:
    """
    Synthesizes discrete risk outputs from individual agents into
    a unified risk matrix with database persistence.
    """

    @staticmethod
    def aggregate_risks(
        agent_results: List[Dict[str, Any]],
        farm_id: str,
        field_id: Optional[str] = None,
        zone_id: Optional[str] = None,
        db: Optional[Session] = None,
    ) -> Dict[str, Any]:
        """
        Extract risks from all agents, prioritize by severity,
        and optionally persist active threats to the database.
        """
        active_risks: List[Dict[str, Any]] = []
        max_score = 0.0
        now_iso = datetime.now(timezone.utc).isoformat()

        for res in agent_results:
            risk = res.get("risk")
            if not risk or not isinstance(risk, dict):
                continue

            score = normalize_risk_score(risk.get("score", 0.0))
            severity = risk.get("severity") or score_to_severity(score)
            risk_type = risk.get("type", "GENERAL")

            if score > max_score:
                max_score = score

            if score >= 30.0:  # Only track non-trivial risks
                rec = res.get("recommendation") or {}
                risk_entry = {
                    "risk_type": risk_type,
                    "agent_name": res.get("agent_name", "UnknownAgent"),
                    "score": score,
                    "severity": severity,
                    "confidence": res.get("confidence", 0.85),
                    "farm_id": farm_id,
                    "field_id": field_id,
                    "zone_id": zone_id,
                    "title": rec.get("title", f"{risk_type} Alert"),
                    "description": rec.get("description", "Potential agronomic stress detected."),
                    "evidence": res.get("evidence", []),
                    "detected_at": now_iso,
                    "status": "ACTIVE",
                }
                active_risks.append(risk_entry)

                # Persist to database if session provided
                if db is not None:
                    try:
                        event = RiskEvent(
                            farm_id=farm_id,
                            field_id=field_id,
                            zone_id=zone_id,
                            risk_type=risk_type,
                            severity=severity,
                            confidence=res.get("confidence", 0.85),
                            title=risk_entry["title"],
                            description=risk_entry["description"],
                            evidence=risk_entry["evidence"],
                            is_resolved=False,
                        )
                        db.add(event)
                        db.commit()
                        risk_entry["id"] = event.id
                    except Exception:
                        db.rollback()

        # Sort risks: CRITICAL first, then HIGH, MEDIUM, LOW
        severity_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
        active_risks.sort(key=lambda r: (severity_order.get(r["severity"], 99), -r["score"]))

        overall_severity = score_to_severity(max_score)

        return {
            "overall_score": round(max_score, 1),
            "overall_severity": overall_severity,
            "risk_count": len(active_risks),
            "active_risks": active_risks,
        }
