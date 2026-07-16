"""In-memory rate limiting (documented known limitation: single-instance only)."""

import threading
import time
from collections import defaultdict, deque


class InMemoryRateLimiter:
    """Sliding-window rate limiter keyed by an arbitrary string (e.g. phone+IP)."""

    def __init__(self, max_attempts: int, window_seconds: int) -> None:
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        self._hits: dict[str, deque] = defaultdict(deque)
        self._lock = threading.Lock()

    def is_allowed(self, key: str) -> bool:
        """Return True if `key` has not exceeded the allowed attempts in the current window."""
        now = time.monotonic()
        with self._lock:
            hits = self._hits[key]
            while hits and now - hits[0] > self.window_seconds:
                hits.popleft()
            return len(hits) < self.max_attempts

    def record_attempt(self, key: str) -> None:
        """Record a new attempt for `key` (call only on failed/sensitive attempts)."""
        with self._lock:
            self._hits[key].append(time.monotonic())

    def reset(self, key: str) -> None:
        """Clear recorded attempts for `key` (call on success)."""
        with self._lock:
            self._hits.pop(key, None)


_login_rate_limiter: InMemoryRateLimiter | None = None


def get_login_rate_limiter() -> InMemoryRateLimiter:
    """Return the process-wide login rate limiter singleton."""
    global _login_rate_limiter
    if _login_rate_limiter is None:
        from app.core.config import get_settings

        settings = get_settings()
        _login_rate_limiter = InMemoryRateLimiter(
            max_attempts=settings.login_rate_limit_max_attempts,
            window_seconds=settings.login_rate_limit_window_minutes * 60,
        )
    return _login_rate_limiter
