"""
rag.py — Production-grade Gemini integration for Document AI Assistant.

Features:
- Model loaded from MODEL_NAME env var (no hardcoded names)
- Automatic fallback chain: gemini-2.5-flash → gemini-2.5-flash-lite → gemini-1.5-flash
- Startup model validation via models.list() (zero extra quota usage)
- Masked API key logging
- Structured error payloads (no raw exception dumps to client)
- Custom exception classes for quota vs. generic API errors
- list_available_models() utility for the /models debug endpoint
"""

import os
import logging
from typing import List, Dict, Any, Generator

from google import genai
from google.genai import types

from prompts import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE, format_context_chunks

# ─── Logging ──────────────────────────────────────────────────────────────────
logger = logging.getLogger(__name__)

# ─── Fallback chain (order matters) ───────────────────────────────────────────
FALLBACK_MODELS: List[str] = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-1.5-flash",
]

# ─── Module-level singletons ──────────────────────────────────────────────────
_client: genai.Client | None = None
_active_model: str | None = None


# ─── Custom exceptions ────────────────────────────────────────────────────────
class GeminiQuotaError(Exception):
    """Raised when the API key hits a rate/quota limit (HTTP 429)."""


class GeminiAPIError(Exception):
    """Raised for any other Gemini API failure."""


# ─── Client factory (singleton) ───────────────────────────────────────────────
def _get_client() -> genai.Client:
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY", "").strip()
        if not api_key:
            raise RuntimeError(
                "GEMINI_API_KEY is not set. Add it to backend/.env and restart."
            )
        _client = genai.Client(api_key=api_key)
        # Log masked key (first 4 + last 4 characters only)
        masked = f"{api_key[:4]}{'*' * (len(api_key) - 8)}{api_key[-4:]}"
        logger.info(f"✅ Gemini client initialised. API key: {masked}")
    return _client


# ─── Available-model helpers ──────────────────────────────────────────────────
def _normalize_model_name(name: str) -> str:
    """Strip the 'models/' prefix that the SDK sometimes returns."""
    return name.replace("models/", "").strip()


def list_available_models() -> List[Dict[str, str]]:
    """
    Return all Gemini models visible to the current API key.
    Uses the SDK's models.list() — zero quota cost.
    """
    client = _get_client()
    results: List[Dict[str, str]] = []
    try:
        for m in client.models.list():
            results.append(
                {
                    "name": _normalize_model_name(m.name),
                    "display_name": getattr(m, "display_name", ""),
                    "description": getattr(m, "description", ""),
                }
            )
    except Exception as exc:
        logger.warning(f"Could not list models: {exc}")
    return results


def _get_available_model_names() -> List[str]:
    """Return just the normalised model name strings."""
    return [m["name"] for m in list_available_models()]


# ─── Startup validation ───────────────────────────────────────────────────────
def initialize_model() -> str:
    """
    Called once at FastAPI startup.
    1. Reads MODEL_NAME from env (default: gemini-2.5-flash).
    2. Checks whether that model is available via models.list().
    3. If not, walks the FALLBACK_MODELS chain until one is found.
    4. Sets _active_model and returns it.
    Never crashes — worst case defaults to the last fallback.
    """
    global _active_model

    configured = os.getenv("MODEL_NAME", "gemini-2.5-flash").strip()
    logger.info(f"Configured MODEL_NAME: '{configured}'")

    try:
        available = _get_available_model_names()
        logger.info(f"Available Gemini models for this key: {available}")
    except Exception as exc:
        logger.error(f"Could not fetch model list at startup: {exc}")
        available = []

    # Build fallback chain: configured model first, then the rest
    chain = [configured] + [m for m in FALLBACK_MODELS if m != configured]

    for candidate in chain:
        if not available or candidate in available:
            # If we couldn't fetch the list, optimistically try the configured model
            _active_model = candidate
            logger.info(f"✅ Active Gemini model set to: '{_active_model}'")
            return _active_model
        logger.warning(
            f"⚠️  Model '{candidate}' not in available list, trying next fallback..."
        )

    # Hard fallback — use last item in chain regardless
    _active_model = chain[-1]
    logger.error(
        f"None of the fallback models appear in the available list. "
        f"Defaulting to '{_active_model}'. Errors will surface at request time."
    )
    return _active_model


def get_active_model() -> str:
    """Return the validated active model, falling back gracefully if startup wasn't called."""
    if _active_model is None:
        # Lazy fallback — should not normally happen in production
        return os.getenv("MODEL_NAME", FALLBACK_MODELS[0]).strip()
    return _active_model


# ─── Error classification ─────────────────────────────────────────────────────
def _classify_error(exc: Exception) -> Exception:
    """Wrap raw SDK exceptions into domain-specific exceptions."""
    msg = str(exc)
    if "429" in msg or "RESOURCE_EXHAUSTED" in msg or "quota" in msg.lower():
        return GeminiQuotaError(msg)
    return GeminiAPIError(msg)


# ─── Generation helpers ───────────────────────────────────────────────────────
def generate_answer_stream(
    question: str,
    context_chunks: List[Dict[str, Any]],
) -> Generator[str, None, None]:
    """
    Streams response tokens from Gemini.
    Raises GeminiQuotaError or GeminiAPIError on failure
    so the caller (app.py SSE generator) can emit a clean error event.
    """
    client = _get_client()
    model = get_active_model()

    context_text = format_context_chunks(context_chunks)
    prompt = USER_PROMPT_TEMPLATE.format(
        context_text=context_text, question=question
    )

    logger.info(f"[CHAT STREAM] Calling model: '{model}'")
    try:
        response = client.models.generate_content_stream(
            model=model,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                temperature=0.2,
            ),
        )
        for chunk in response:
            if chunk.text:
                yield chunk.text

    except Exception as exc:
        logger.error(f"[CHAT STREAM] Gemini error on model '{model}': {exc}")
        raise _classify_error(exc) from exc


def generate_answer(
    question: str,
    context_chunks: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Non-streaming generation.
    Returns {"text": str} on success or {"error": str, "details": str} on failure.
    """
    client = _get_client()
    model = get_active_model()

    context_text = format_context_chunks(context_chunks)
    prompt = USER_PROMPT_TEMPLATE.format(
        context_text=context_text, question=question
    )

    logger.info(f"[CHAT] Calling model (non-stream): '{model}'")
    try:
        response = client.models.generate_content(
            model=model,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                temperature=0.2,
            ),
        )
        return {"text": response.text}

    except Exception as exc:
        logger.error(f"[CHAT] Gemini error on model '{model}': {exc}")
        classified = _classify_error(exc)
        if isinstance(classified, GeminiQuotaError):
            return {
                "error": "Gemini API quota exceeded.",
                "details": (
                    "Your API key has hit the free-tier rate limit. "
                    "Please check your quota at https://ai.google.dev/gemini-api/docs/rate-limits "
                    "or upgrade your plan."
                ),
            }
        return {
            "error": "Gemini API error.",
            "details": "An unexpected error occurred. Check backend logs for details.",
        }
