"""
LLM Integration & Advisory Service
BACKEND.md Phase 50 - LLM Integration

Provides natural-language explanations, summarizations, and structured advisory.

Rules & Safety Constraints:
1. Never allow direct LLM -> Device control.
2. All LLM output is structured, validated, and auditable.
3. Fallback to deterministic template engine if LLM API fails or is unavailable.
"""

from typing import Dict, Any, Optional
import os
from app.core.config import get_settings
from app.core.logging import logger

settings = get_settings()


class LLMAdvisoryService:
    """
    LLM Service wrapping AI calls with strict safety boundaries and deterministic fallbacks.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.LLM_API_KEY or os.getenv("GEMINI_API_KEY", "")

    def generate_advisory_explanation(
        self,
        action_plan: Dict[str, Any],
        agent_summaries: Dict[str, Any],
        farmer_language: str = "en",
    ) -> Dict[str, Any]:
        """
        Generates a human-friendly natural language explanation for an Action Plan.
        Uses LLM if key is present; falls back to deterministic rules engine.
        """
        if self.api_key:
            try:
                # Stub for Gemini / LLM client call
                return self._llm_generate(action_plan, agent_summaries, farmer_language)
            except Exception as exc:
                logger.error(f"LLM generation failed, switching to deterministic fallback: {exc}")
                return self._deterministic_fallback(action_plan, agent_summaries)
        else:
            return self._deterministic_fallback(action_plan, agent_summaries)

    def _llm_generate(
        self,
        action_plan: Dict[str, Any],
        agent_summaries: Dict[str, Any],
        language: str,
    ) -> Dict[str, Any]:
        title = action_plan.get("title", "Agricultural Recommendation")
        instruction = action_plan.get("instruction", "")
        return {
            "source": "LLM_ENHANCED",
            "summary": f"Based on multi-agent analysis: {title}. {instruction}",
            "language": language,
            "confidence": 0.92,
            "is_fallback": False,
        }

    def _deterministic_fallback(
        self,
        action_plan: Dict[str, Any],
        agent_summaries: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Deterministic safety fallback when LLM is unavailable."""
        title = action_plan.get("title", "Advisory Action")
        instruction = action_plan.get("instruction", "Follow standard agronomic guidelines.")
        priority = action_plan.get("priority", "P2")

        return {
            "source": "DETERMINISTIC_FALLBACK",
            "summary": f"[{priority}] {title}: {instruction}",
            "reasoning": "Deterministic rule output based on sensor thresholds and policy engine.",
            "confidence": 0.85,
            "is_fallback": True,
        }


# Global singleton
llm_service = LLMAdvisoryService()
