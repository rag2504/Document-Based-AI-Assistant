import os
import json
import logging
import shutil
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, HTTPException, status
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv

# ── Load env before any local imports ─────────────────────────────────────────
load_dotenv()

# ── Logging setup ─────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# ── Local imports ─────────────────────────────────────────────────────────────
from utils import allowed_file, ensure_directory
from document_loader import load_and_chunk_file
from embeddings import get_embedding_model
from vector_store import get_vector_store
from rag import (
    GeminiAPIError,
    GeminiQuotaError,
    generate_answer,
    generate_answer_stream,
    get_active_model,
    initialize_model,
    list_available_models,
)

# ── Startup / shutdown lifecycle ───────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Runs once when the server starts.
    Validates the Gemini model and warms up the embedding singleton.
    """
    logger.info("=" * 60)
    logger.info("Starting Document AI Assistant backend …")

    # 1. Validate & select the Gemini model
    active = initialize_model()
    logger.info(f"Gemini model confirmed: '{active}'")

    # 2. Warm-up the embedding model (loads weights into memory once)
    logger.info("Loading sentence-transformer embedding model …")
    get_embedding_model()
    logger.info("Embedding model ready.")

    logger.info("=" * 60)
    yield  # ← server is running
    logger.info("Shutting down Document AI Assistant backend.")


# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Document-Based AI Assistant API",
    description="RAG pipeline: PDF/TXT → ChromaDB → Gemini → grounded answers",
    version="2.0.0",
    lifespan=lifespan,
)

# ── CORS ───────────────────────────────────────────────────────────────────────
# Set ALLOWED_ORIGINS in Render env vars to your Vercel URL, e.g.:
#   https://docai.vercel.app,https://docai-git-main-yourname.vercel.app
_origins_env = os.getenv("ALLOWED_ORIGINS", "*")
ALLOWED_ORIGINS = (
    [o.strip() for o in _origins_env.split(",") if o.strip()]
    if _origins_env != "*"
    else ["*"]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
ensure_directory(UPLOAD_DIR)

# ── Session state (in-memory, single-user) ─────────────────────────────────────
state: dict = {"active_filename": None}


# ── Request models ─────────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    question: str
    filename: Optional[str] = None
    stream: Optional[bool] = True


# ─────────────────────────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/")
def read_root():
    return {
        "status": "running",
        "active_file": state["active_filename"],
        "active_model": get_active_model(),
    }


# ── Debug: list available models ──────────────────────────────────────────────
@app.get("/models")
def get_models():
    """
    Lists all Gemini models available for the configured API key.
    Useful for debugging quota or availability issues.
    """
    try:
        models = list_available_models()
        return {
            "active_model": get_active_model(),
            "model_count": len(models),
            "models": models,
        }
    except Exception as exc:
        logger.error(f"[/models] Failed to list models: {exc}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to retrieve model list. Verify your GEMINI_API_KEY.",
        )


# ── Upload ─────────────────────────────────────────────────────────────────────
@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Accepts PDF or TXT files.
    If already indexed in ChromaDB, returns cached stats instantly.
    Otherwise: extract → chunk → embed → store.
    """
    if not allowed_file(file.filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Only PDF and TXT documents are allowed.",
        )

    filename = os.path.basename(file.filename)
    file_path = os.path.join(UPLOAD_DIR, filename)

    # Save file to disk
    try:
        with open(file_path, "wb") as buf:
            shutil.copyfileobj(file.file, buf)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {exc}",
        )

    vector_store = get_vector_store()

    # Return early if already indexed (cache hit)
    if vector_store.is_file_indexed(filename):
        chunk_count = vector_store.count_chunks_for_file(filename)
        state["active_filename"] = filename
        logger.info(f"[UPLOAD] Cache hit: '{filename}' ({chunk_count} chunks)")
        return {
            "success": True,
            "filename": filename,
            "chunks": chunk_count,
            "message": "File loaded from cache (already indexed).",
        }

    # Process new file
    try:
        logger.info(f"[UPLOAD] Indexing new file: '{filename}'")
        chunks = load_and_chunk_file(file_path)

        if not chunks:
            os.remove(file_path)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded document contains no readable text.",
            )

        emb_model = get_embedding_model()
        texts = [c["chunk_text"] for c in chunks]
        embeddings = emb_model.embed_documents(texts)
        vector_store.add_chunks(chunks, embeddings)

        state["active_filename"] = filename
        logger.info(f"[UPLOAD] Indexed '{filename}' → {len(chunks)} chunks")

        return {
            "success": True,
            "filename": filename,
            "chunks": len(chunks),
            "message": "File uploaded and indexed successfully.",
        }

    except HTTPException:
        raise
    except Exception as exc:
        if os.path.exists(file_path):
            os.remove(file_path)
        logger.error(f"[UPLOAD] Indexing failed for '{filename}': {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process and index document: {exc}",
        )


# ── Chat ───────────────────────────────────────────────────────────────────────
@app.post("/chat")
def chat(request: ChatRequest):
    """
    RAG chat endpoint.
    - Embeds the question, retrieves top-5 chunks from ChromaDB.
    - Calls Gemini and streams or returns a grounded answer.
    - Returns structured JSON errors on Gemini failures (never raw exceptions).
    """
    filename = request.filename or state["active_filename"]
    if not filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active document. Please upload a document first.",
        )

    vector_store = get_vector_store()
    if not vector_store.is_file_indexed(filename):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document '{filename}' is not indexed. Please re-upload.",
        )

    # 1. Embed question
    emb_model = get_embedding_model()
    query_emb = emb_model.embed_query(request.question)

    # 2. Similarity search (top 5)
    top_k = int(os.getenv("TOP_K", 5))
    relevant_chunks = vector_store.query_similarity(query_emb, filename, top_k=top_k)

    # 3. No relevant chunks → deterministic fallback
    if not relevant_chunks:
        fallback = "I couldn't find that information in the uploaded document."
        if request.stream:
            def _empty_stream():
                yield "event: sources\ndata: []\n\n"
                yield f"event: text\ndata: {fallback}\n\n"
                yield "event: end\ndata: [DONE]\n\n"
            return StreamingResponse(_empty_stream(), media_type="text/event-stream")
        return {"answer": fallback, "sources": []}

    # Format sources
    sources = [
        {"chunk_id": c["chunk_id"], "page": c["page_number"], "text": c["text"]}
        for c in relevant_chunks
    ]

    # 4a. Streaming (SSE)
    if request.stream:
        def sse_generator():
            # Send citations first so the UI can render them before the text starts
            yield f"event: sources\ndata: {json.dumps(sources)}\n\n"

            try:
                for token in generate_answer_stream(request.question, relevant_chunks):
                    # Escape newlines so they don't break the SSE frame
                    safe_token = token.replace("\n", " ")
                    yield f"event: text\ndata: {safe_token}\n\n"

            except GeminiQuotaError:
                msg = (
                    "⚠️ Gemini API quota exceeded. Your free-tier limit has been reached. "
                    "Please wait a minute and try again, or check your quota at "
                    "https://ai.google.dev/gemini-api/docs/rate-limits"
                )
                yield f"event: text\ndata: {msg}\n\n"

            except GeminiAPIError as exc:
                msg = f"⚠️ Gemini API error. Check backend logs for details."
                yield f"event: text\ndata: {msg}\n\n"

            yield "event: end\ndata: [DONE]\n\n"

        return StreamingResponse(sse_generator(), media_type="text/event-stream")

    # 4b. Non-streaming JSON
    result = generate_answer(request.question, relevant_chunks)

    if "error" in result:
        # Return a structured JSON error response
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "success": False,
                "error": result["error"],
                "details": result.get("details", ""),
                "sources": sources,
            },
        )

    return {"answer": result["text"], "sources": sources}


# ── Clear session ──────────────────────────────────────────────────────────────
@app.post("/clear")
def clear_active_document():
    """Clears the current active document session."""
    state["active_filename"] = None
    return {"success": True, "message": "Active document reset."}
