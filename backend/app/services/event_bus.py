"""
Internal Event Bus & Dispatcher
BACKEND.md Phase 33

Decouples services via pub/sub events:
- sensor.reading.created
- weather.updated
- agent.started / agent.completed
- risk.detected / risk.resolved
- action.plan.created / action.approved / action.rejected
- task.started / task.completed / task.failed
- execution.started / execution.completed
- expert.escalation.created
- alert.created
"""

from typing import Callable, Dict, List, Any, Optional
from datetime import datetime, timezone
from app.core.logging import logger


class EventBus:
    """
    In-process, asynchronous/synchronous event dispatcher.
    Keeps domain services loosely coupled.
    """

    def __init__(self):
        self._subscribers: Dict[str, List[Callable[[Dict[str, Any]], None]]] = {}
        self._event_history: List[Dict[str, Any]] = []

    def subscribe(self, event_type: str, handler: Callable[[Dict[str, Any]], None]) -> None:
        """Register a callback for a specific event type."""
        if event_type not in self._subscribers:
            self._subscribers[event_type] = []
        self._subscribers[event_type].append(handler)

    def publish(self, event_type: str, payload: Dict[str, Any]) -> None:
        """
        Broadcast event to all registered subscribers and record in telemetry history.
        """
        event_record = {
            "event_type": event_type,
            "payload": payload,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        self._event_history.append(event_record)
        if len(self._event_history) > 500:
            self._event_history.pop(0)

        logger.info(f"Event published: [{event_type}]")

        handlers = self._subscribers.get(event_type, [])
        # Also notify wildcard subscribers
        wildcard_handlers = self._subscribers.get("*", [])

        for handler in handlers + wildcard_handlers:
            try:
                handler(payload)
            except Exception as exc:
                logger.error(f"Error in event handler for [{event_type}]: {exc}")

    def get_recent_events(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Return chronological event stream."""
        return list(reversed(self._event_history[-limit:]))


# Global singleton event bus instance
event_bus = EventBus()
