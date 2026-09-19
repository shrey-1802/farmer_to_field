"""
Base Agent Contract
BACKEND.md Phase 16

Every agent must implement:
- run(context: dict) -> dict
- validate_input(context: dict) -> bool
- validate_output(result: dict) -> bool
- get_status() -> dict
- get_metadata() -> dict

Every agent result must contain:
- agent_name: str
- run_id: str
- timestamp: str (ISO)
- status: str ("SUCCESS", "FAILED", "WARNING")
- risk: dict (score: 0-100, severity: LOW/MEDIUM/HIGH/CRITICAL, type: str)
- confidence: float (0.0 to 1.0)
- evidence: list or dict
- recommendation: dict
"""

import uuid
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Dict, Any, Optional


class BaseAgent(ABC):
    """
    Abstract Base Class for all agricultural AI agents.
    Enforces the standardized Phase 16 contract.
    """

    def __init__(self, name: str, version: str = "1.0.0", description: str = ""):
        self.name = name
        self.version = version
        self.description = description
        self.last_run_at: Optional[str] = None
        self.total_runs: int = 0
        self.successful_runs: int = 0

    def get_metadata(self) -> Dict[str, Any]:
        """Return agent specification and operational capabilities."""
        return {
            "agent_name": self.name,
            "version": self.version,
            "description": self.description,
            "supported_inputs": self._supported_inputs(),
            "supported_outputs": self._supported_outputs(),
        }

    def get_status(self) -> Dict[str, Any]:
        """Return operational health and execution counters."""
        return {
            "agent_name": self.name,
            "status": "HEALTHY",
            "last_run_at": self.last_run_at,
            "total_runs": self.total_runs,
            "successful_runs": self.successful_runs,
        }

    def validate_input(self, context: Dict[str, Any]) -> bool:
        """
        Validate that the farm context contains the minimum required keys.
        """
        if not isinstance(context, dict):
            return False
        # Basic context validity check
        return "farm" in context or "sensor_summary" in context

    def validate_output(self, result: Dict[str, Any]) -> bool:
        """
        Ensure output strictly conforms to Phase 16 structured contract.
        """
        required_fields = [
            "agent_name",
            "run_id",
            "timestamp",
            "status",
            "risk",
            "confidence",
            "evidence",
            "recommendation",
        ]
        if not all(field in result for field in required_fields):
            return False

        # Validate risk sub-structure
        risk = result.get("risk")
        if not isinstance(risk, dict):
            return False
        if not all(k in risk for k in ["score", "severity", "type"]):
            return False

        # Validate confidence is a probability
        conf = result.get("confidence")
        if not (isinstance(conf, (int, float)) and 0.0 <= conf <= 1.0):
            return False

        return True

    def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute wrapper that handles lifecycle tracking, input validation,
        output verification, and error containment.
        """
        self.total_runs += 1
        run_id = str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()

        if not self.validate_input(context):
            return {
                "agent_name": self.name,
                "run_id": run_id,
                "timestamp": now_iso,
                "status": "FAILED",
                "risk": {"score": 0.0, "severity": "LOW", "type": "NONE"},
                "confidence": 0.0,
                "evidence": ["Input validation failed: context missing required farm telemetry"],
                "recommendation": {
                    "action": "ABORT",
                    "title": "Invalid Telemetry Input",
                    "description": "The agent was invoked with invalid or incomplete context.",
                },
                "data": {},
            }

        try:
            result = self.run(context)
            # Ensure standard header fields
            result.setdefault("agent_name", self.name)
            result.setdefault("run_id", run_id)
            result.setdefault("timestamp", now_iso)
            result.setdefault("status", "SUCCESS")

            if not self.validate_output(result):
                result["status"] = "WARNING"
                result.setdefault("evidence", ["Output validation warning: non-critical format deviation"])

            self.successful_runs += 1
            self.last_run_at = now_iso
            return result
        except Exception as exc:
            return {
                "agent_name": self.name,
                "run_id": run_id,
                "timestamp": now_iso,
                "status": "FAILED",
                "risk": {"score": 50.0, "severity": "MEDIUM", "type": "AGENT_EXECUTION_ERROR"},
                "confidence": 0.0,
                "evidence": [f"Execution error: {str(exc)}"],
                "recommendation": {
                    "action": "RETRY",
                    "title": "Agent Execution Failed",
                    "description": f"Internal agent computation error: {str(exc)}",
                },
                "data": {"error": str(exc)},
            }

    @abstractmethod
    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Core domain logic to be implemented by specialized agents."""
        pass

    @abstractmethod
    def _supported_inputs(self) -> list:
        pass

    @abstractmethod
    def _supported_outputs(self) -> list:
        pass
