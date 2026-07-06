"""
rag.py — Production-grade Groq integration for Document AI Assistant.

Features:
- Model loaded from MODEL_NAME env var (default: llama-3.3-70b-versatile)
- Automatic fallback chain: llama-3.3-70b-versatile → llama-3.1-8b-instant → mixtral-8x7b-32768
- Startup model validation via models.list()
- Masked API key logging
- Custom exception classes matching original names for app.py compatibility
"""

import os
import time
import logging
from typing import List, Dict, Any, Generator

from groq import Groq  # type: ignore

from prompts import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE, format_context_chunks
from utils import validate_groq_api_key

# ─── Logging ──────────────────────────────────────────────────────────────────
logger = logging.getLogger(__name__)

# ─── Fallback chain (order matters) ───────────────────────────────────────────
FALLBACK_MODELS: List[str] = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768",
    "gemma2-9b-it"
]

# ─── Module-level singletons ──────────────────────────────────────────────────
_client: Groq | None = None
_active_model: str | None = None


# ─── Custom exceptions (names preserved for app.py compatibility) ───────────────
class GeminiQuotaError(Exception):
    """Raised when the Groq API key hits a rate/quota limit (HTTP 429)."""
    pass


class GeminiAPIError(Exception):
    """Raised for any other Groq API failure."""
    pass


# ─── Client factory (singleton) ───────────────────────────────────────────────
def _get_client() -> Groq:
    global _client
    if _client is None:
        api_key = os.getenv("GROQ_API_KEY", "").strip()
        validate_groq_api_key(api_key)
        _client = Groq(api_key=api_key)
        # Log masked key
        masked = f"{api_key[:4]}{'*' * (len(api_key) - 8)}{api_key[-4:]}"
        logger.info(f"✅ Groq client initialised. API key: {masked}")
    return _client


# ─── Available-model helpers ──────────────────────────────────────────────────
def list_available_models() -> List[Dict[str, str]]:
    """
    Return all Groq models visible to the current API key.
    Uses the SDK's models.list().
    """
    client = _get_client()
    results: List[Dict[str, str]] = []
    try:
        models = client.models.list()
        for m in models.data:
            results.append(
                {
                    "name": m.id,
                    "display_name": m.id,
                    "description": f"Groq Model {m.id}",
                }
            )
    except Exception as exc:
        logger.warning(f"Could not list models: {exc}")
    return results


# ─── Startup validation ───────────────────────────────────────────────────────
def initialize_model() -> str:
    """
    Called once at FastAPI startup.
    """
    global _active_model

    configured = os.getenv("MODEL_NAME", "llama-3.3-70b-versatile").strip()
    logger.info(f"Configured MODEL_NAME: '{configured}'")

    try:
        available = [m["name"] for m in list_available_models()]
        logger.info(f"Available Groq models for this key: {available}")
    except Exception as exc:
        logger.error(f"Could not fetch model list at startup: {exc}")
        available = []

    # Build fallback chain: configured model first, then the rest
    chain = [configured] + [m for m in FALLBACK_MODELS if m != configured]

    for candidate in chain:
        if not available or candidate in available:
            _active_model = candidate
            logger.info(f"✅ Active Groq model set to: '{_active_model}'")
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
        return os.getenv("MODEL_NAME", FALLBACK_MODELS[0]).strip()
    return _active_model


# ─── Error classification ─────────────────────────────────────────────────────
def _classify_error(exc: Exception) -> Exception:
    """Wrap raw SDK exceptions into domain-specific exceptions."""
    msg = str(exc)
    if "429" in msg or "rate limit" in msg.lower():
        return GeminiQuotaError(msg)
    return GeminiAPIError(msg)


# ─── Generation helpers ───────────────────────────────────────────────────────
def generate_answer_stream(
    question: str,
    context_chunks: List[Dict[str, Any]],
) -> Generator[str, None, None]:
    """
    Streams response tokens from Groq.
    """
    client = _get_client()
    model = get_active_model()

    context_text = format_context_chunks(context_chunks)
    prompt = USER_PROMPT_TEMPLATE.format(
        context_text=context_text, question=question
    )

    max_retries = 3
    retry_delay = 2.0

    logger.info(f"[CHAT STREAM] Calling Groq model: '{model}'")
    
    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                stream=True,
            )
            for chunk in response:
                content = chunk.choices[0].delta.content
                if content:
                    yield content
            return  # Success, exit the function

        except Exception as exc:
            classified = _classify_error(exc)
            if isinstance(classified, GeminiQuotaError) and attempt < max_retries - 1:
                logger.warning(
                    f"[CHAT STREAM] Rate limit hit (429), retrying in {retry_delay}s... "
                    f"(Attempt {attempt + 1}/{max_retries})"
                )
                time.sleep(retry_delay)
                retry_delay *= 1.5
                continue
            
            logger.error(f"[CHAT STREAM] Groq error on model '{model}': {exc}")
            raise classified from exc


def generate_answer(
    question: str,
    context_chunks: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Non-streaming generation.
    """
    client = _get_client()
    model = get_active_model()

    context_text = format_context_chunks(context_chunks)
    prompt = USER_PROMPT_TEMPLATE.format(
        context_text=context_text, question=question
    )

    max_retries = 3
    retry_delay = 2.0

    logger.info(f"[CHAT] Calling Groq model (non-stream): '{model}'")
    
    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
            )
            return {"text": response.choices[0].message.content}

        except Exception as exc:
            classified = _classify_error(exc)
            if isinstance(classified, GeminiQuotaError) and attempt < max_retries - 1:
                logger.warning(
                    f"[CHAT] Rate limit hit (429), retrying in {retry_delay}s... "
                    f"(Attempt {attempt + 1}/{max_retries})"
                )
                time.sleep(retry_delay)
                retry_delay *= 1.5
                continue

            logger.error(f"[CHAT] Groq error on model '{model}': {exc}")
            if isinstance(classified, GeminiQuotaError):
                return {
                    "error": "Groq API quota exceeded.",
                    "details": "Your API key has hit the rate limit. Please try again in a minute.",
                }
            return {
                "error": "Groq API error.",
                "details": "An unexpected error occurred. Check backend logs for details.",
            }
