"""
In-Process Cache Service
BACKEND.md Phase 39 - Caching

Provides a fast, TTL-aware in-memory cache as a Redis-compatible abstraction.
For production, swap the backend to an actual Redis client without changing
calling code.

Cached:
- Weather API responses (30-minute TTL)
- Short-lived computed values
- Rate-limiting counters
"""

from __future__ import annotations

import threading
import time
from typing import Any, Dict, Optional, Tuple

from app.core.logging import logger


class _CacheEntry:
    __slots__ = ("value", "expires_at")

    def __init__(self, value: Any, ttl_seconds: float):
        self.value = value
        self.expires_at: float = time.monotonic() + ttl_seconds if ttl_seconds > 0 else float("inf")

    @property
    def is_expired(self) -> bool:
        return time.monotonic() > self.expires_at


class InProcessCache:
    """
    Thread-safe, TTL-aware in-memory key-value cache.

    Designed as a thin abstraction so the backend can be swapped to Redis
    without touching callers.
    """

    def __init__(self, max_entries: int = 2048):
        self._store: Dict[str, _CacheEntry] = {}
        self._lock = threading.Lock()
        self._max_entries = max_entries
        self._hits = 0
        self._misses = 0

    # ------------------------------------------------------------------ #
    #  Core Operations                                                      #
    # ------------------------------------------------------------------ #

    def set(self, key: str, value: Any, ttl_seconds: float = 300.0) -> None:
        """Store *value* at *key* with an optional TTL (seconds)."""
        with self._lock:
            if len(self._store) >= self._max_entries:
                self._evict_expired()
            self._store[key] = _CacheEntry(value, ttl_seconds)

    def get(self, key: str) -> Optional[Any]:
        """Return cached value or *None* if missing / expired."""
        with self._lock:
            entry = self._store.get(key)
            if entry is None or entry.is_expired:
                if entry and entry.is_expired:
                    del self._store[key]
                self._misses += 1
                return None
            self._hits += 1
            return entry.value

    def delete(self, key: str) -> bool:
        """Remove a key. Returns True if it existed."""
        with self._lock:
            return self._store.pop(key, None) is not None

    def exists(self, key: str) -> bool:
        """Check whether a valid (non-expired) entry exists."""
        return self.get(key) is not None

    def incr(self, key: str, ttl_seconds: float = 60.0) -> int:
        """Increment a counter (creates it at 1 if not present). Used for rate limiting."""
        with self._lock:
            entry = self._store.get(key)
            if entry is None or entry.is_expired:
                self._store[key] = _CacheEntry(1, ttl_seconds)
                return 1
            entry.value = (entry.value or 0) + 1
            return entry.value

    def flush(self) -> None:
        """Clear all entries (useful for testing)."""
        with self._lock:
            self._store.clear()
            self._hits = 0
            self._misses = 0

    # ------------------------------------------------------------------ #
    #  Maintenance                                                          #
    # ------------------------------------------------------------------ #

    def _evict_expired(self) -> None:
        """Remove all expired entries (called under lock)."""
        expired_keys = [k for k, v in self._store.items() if v.is_expired]
        for k in expired_keys:
            del self._store[k]

    def stats(self) -> Dict[str, Any]:
        with self._lock:
            total = self._hits + self._misses
            hit_rate = round(self._hits / total, 4) if total else 0.0
            active = sum(1 for v in self._store.values() if not v.is_expired)
            return {
                "active_entries": active,
                "total_entries": len(self._store),
                "hits": self._hits,
                "misses": self._misses,
                "hit_rate": hit_rate,
            }


# ------------------------------------------------------------------ #
#  Convenience helpers for namespaced weather / rate-limit caches    #
# ------------------------------------------------------------------ #

class WeatherCache:
    """Thin wrapper around InProcessCache for weather data (30-min TTL)."""

    TTL = 1800  # seconds

    def __init__(self, cache: InProcessCache):
        self._cache = cache

    def _key(self, lat: float, lon: float) -> str:
        return f"weather:{lat:.4f}:{lon:.4f}"

    def get(self, lat: float, lon: float) -> Optional[Dict[str, Any]]:
        return self._cache.get(self._key(lat, lon))

    def set(self, lat: float, lon: float, data: Dict[str, Any]) -> None:
        self._cache.set(self._key(lat, lon), data, ttl_seconds=self.TTL)
        logger.debug(f"Weather cached for ({lat}, {lon}) — TTL {self.TTL}s")

    def invalidate(self, lat: float, lon: float) -> None:
        self._cache.delete(self._key(lat, lon))


class RateLimitCache:
    """Per-endpoint/per-IP request counter with sliding TTL."""

    def __init__(self, cache: InProcessCache):
        self._cache = cache

    def _key(self, identifier: str, endpoint: str) -> str:
        return f"rl:{endpoint}:{identifier}"

    def increment(self, identifier: str, endpoint: str, window_seconds: float = 60.0) -> int:
        return self._cache.incr(self._key(identifier, endpoint), ttl_seconds=window_seconds)

    def get_count(self, identifier: str, endpoint: str) -> int:
        return self._cache.get(self._key(identifier, endpoint)) or 0

    def reset(self, identifier: str, endpoint: str) -> None:
        self._cache.delete(self._key(identifier, endpoint))


# ------------------------------------------------------------------ #
#  Global singletons                                                  #
# ------------------------------------------------------------------ #

cache = InProcessCache()
weather_cache = WeatherCache(cache)
rate_limit_cache = RateLimitCache(cache)
