"""
conftest.py — shared fixtures for the entire test session.

Motor (async MongoDB driver) binds its connection pool to the running event loop
at import time. If each test gets a separate event loop (pytest-asyncio default),
the pool closes with the first loop and all subsequent tests raise RuntimeError.
Using a session-scoped event loop keeps Motor alive for all tests.
"""
import asyncio
import pytest


@pytest.fixture(scope="session")
def event_loop():
    """Create ONE event loop shared across the entire test session."""
    policy = asyncio.get_event_loop_policy()
    loop = policy.new_event_loop()
    yield loop
    loop.close()
