"""Thin LLM gateway. One function — `generate` — that every feature calls.

It picks a provider from LLM_PROVIDER (gemini | anthropic | openai), calls it over plain
REST with an 8s timeout, and returns None on *any* failure (bad key, timeout, provider
outage, MOCK_LLM=true). Callers (teachback.py, explain.py, alert.py) always have a
deterministic keyword-based fallback for when this returns None, so a flaky API or a
missing key never breaks the demo.
"""
import httpx

from app.config import settings


async def generate(prompt: str) -> str | None:
    if settings.mock_llm:
        return None
    try:
        if settings.llm_provider == "gemini":
            return await _call_gemini(prompt)
        if settings.llm_provider == "anthropic":
            return await _call_anthropic(prompt)
        if settings.llm_provider == "openai":
            return await _call_openai(prompt)
    except Exception as exc:  # network error, bad key, malformed response, timeout, ...
        print(f"[llm] {settings.llm_provider} call failed, falling back: {exc}")
    return None


async def _call_gemini(prompt: str) -> str:
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{settings.gemini_model}:generateContent?key={settings.gemini_api_key}"
    )
    body = {"contents": [{"parts": [{"text": prompt}]}]}
    async with httpx.AsyncClient(timeout=settings.llm_timeout_seconds) as client:
        resp = await client.post(url, json=body)
        resp.raise_for_status()
        data = resp.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]


async def _call_anthropic(prompt: str) -> str:
    url = "https://api.anthropic.com/v1/messages"
    headers = {
        "x-api-key": settings.anthropic_api_key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }
    body = {
        "model": settings.anthropic_model,
        "max_tokens": 512,
        "messages": [{"role": "user", "content": prompt}],
    }
    async with httpx.AsyncClient(timeout=settings.llm_timeout_seconds) as client:
        resp = await client.post(url, headers=headers, json=body)
        resp.raise_for_status()
        data = resp.json()
        return data["content"][0]["text"]


async def _call_openai(prompt: str) -> str:
    url = "https://api.openai.com/v1/chat/completions"
    headers = {"Authorization": f"Bearer {settings.openai_api_key}"}
    body = {
        "model": settings.openai_model,
        "messages": [{"role": "user", "content": prompt}],
    }
    async with httpx.AsyncClient(timeout=settings.llm_timeout_seconds) as client:
        resp = await client.post(url, headers=headers, json=body)
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]
