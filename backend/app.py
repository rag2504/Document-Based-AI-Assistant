import os
import json
import logging
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, UploadFile, File, HTTPException, status, Header
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
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
from utils import validate_file_content, allowed_file, InvalidAPIKeyError
from document_loader import load_and_chunk_bytes
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
    Validates the Groq model and warms up the embedding singleton.
    """
    logger.info("=" * 60)
    logger.info("Starting Document AI Assistant backend …")

    # 1. Validate & select the Groq model
    try:
        active = initialize_model()
        logger.info(f"Groq model confirmed: '{active}'")
    except InvalidAPIKeyError as e:
        logger.error(f"❌ API Key Configuration Error: {e}")
        logger.warning("FastAPI running in degraded state (API key invalid). Check configuration.")
    except Exception as e:
        logger.error(f"❌ Startup check failed: {e}")

    # 2. Warm-up the embedding model (loads weights into memory once)
    try:
        logger.info("Loading fastembed embedding model …")
        get_embedding_model()
        logger.info("Embedding model ready.")
    except Exception as e:
        logger.error(f"❌ Failed to load embedding model: {e}")

    logger.info("=" * 60)
    yield  # ← server is running
    logger.info("Shutting down Document AI Assistant backend.")


# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Document-Based AI Assistant API",
    description="RAG pipeline: PDF/TXT → Supabase pgvector → Groq → grounded answers",
    version="2.1.0",
    lifespan=lifespan,
)

# ── Global Exception Handlers ─────────────────────────────────────────────────
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc: HTTPException):
    """
    Returns standardized JSON error responses with CORS headers.
    """
    origin = request.headers.get("origin")
    headers = {}
    if origin and origin in ALLOWED_ORIGINS:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"

    error_msg = exc.detail
    details_msg = ""
    if isinstance(exc.detail, dict):
        error_msg = exc.detail.get("error", "HTTP Error")
        details_msg = exc.detail.get("details", "")

    return JSONResponse(
        status_code=exc.status_code,
        headers=headers,
        content={
            "success": False,
            "error": error_msg,
            "details": details_msg,
            "code": f"HTTP_{exc.status_code}"
        }
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request, exc: Exception):
    """
    Catches unhandled exceptions and returns CORS-compliant JSON responses.
    Gracefully handles invalid or expired Groq API keys.
    """
    origin = request.headers.get("origin")
    headers = {}
    if origin and origin in ALLOWED_ORIGINS:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"

    logger.error(f"Unhandled exception occurred: {exc}", exc_info=True)
    
    if isinstance(exc, InvalidAPIKeyError):
        return JSONResponse(
            status_code=400,
            headers=headers,
            content={
                "success": False,
                "error": "Invalid Groq API Key Configuration",
                "details": str(exc),
                "code": "GROQ_INVALID_KEY_FORMAT"
            }
        )

    # Check for invalid/expired Groq API Key
    exc_msg = str(exc).lower()
    if "api key not valid" in exc_msg or "api_key_invalid" in exc_msg or "unauthorized" in exc_msg or "forbidden" in exc_msg or "invalid_api_key" in exc_msg:
        return JSONResponse(
            status_code=400,
            headers=headers,
            content={
                "success": False,
                "error": "Invalid or Expired API Key",
                "details": "Your GROQ_API_KEY in the backend/.env file is invalid or has expired. Please check your key or create a new one in the Groq Console.",
                "code": "GROQ_INVALID_KEY"
            }
        )

    return JSONResponse(
        status_code=500,
        headers=headers,
        content={
            "success": False,
            "error": "Internal Server Error",
            "details": "An unexpected error occurred on the server. Please check the backend logs.",
            "code": "INTERNAL_SERVER_ERROR"
        }
    )

# ── CORS ───────────────────────────────────────────────────────────────────────
_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
ALLOWED_ORIGINS = [o.strip() for o in _origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request models ─────────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    question: str
    filename: Optional[str] = None
    stream: Optional[bool] = True
    conversation_id: str
    message_id: str


# ─────────────────────────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/")
def read_root():
    return {
        "status": "running",
        "active_model": get_active_model(),
    }

@app.get("/models")
def get_models():
    """
    Lists all Groq models available for the configured API key.
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
            detail="Unable to retrieve model list. Verify your GROQ_API_KEY.",
        )

# ── Health & Readiness Probes ─────────────────────────────────────────────────
@app.get("/health")
def health_check():
    """
    Fast health check endpoint.
    """
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}

@app.get("/readiness")
def readiness_check():
    """
    Readiness check endpoint that verifies Supabase connection status.
    """
    try:
        vs = get_vector_store()
        # Query 1 row from documents to check database availability
        vs.client.table("documents").select("id").limit(1).execute()
        return {"status": "ready", "database": "connected"}
    except Exception as e:
        logger.error(f"Readiness check failed (database disconnected): {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "Service Unavailable",
                "details": "Database connection is offline."
            }
        )

# ── Session Data ──────────────────────────────────────────────────────────────
@app.get("/session/data")
def get_session_data(x_session_id: str = Header(None)):
    """
    Fetches all documents and conversations for a session.
    Optimized to fetch all conversation messages in a single query (solves N+1 query problem).
    """
    if not x_session_id:
        raise HTTPException(status_code=400, detail="Missing x-session-id header")
        
    vs = get_vector_store()
    
    # 1. Fetch documents
    docs_res = vs.client.table("documents").select("*").eq("session_id", x_session_id).order("uploaded_at", desc=True).execute()
    documents = docs_res.data
    
    # 2. Fetch conversations
    convs_res = vs.client.table("conversations").select("*").eq("session_id", x_session_id).order("updated_at", desc=True).execute()
    conversations = []
    
    if convs_res.data:
        conv_ids = [c["id"] for c in convs_res.data]
        
        # 3. Batch fetch ALL messages for ALL user conversations in ONE query
        msgs_res = vs.client.table("chat_messages").select("*").in_("conversation_id", conv_ids).order("created_at").execute()
        
        # Group messages by conversation ID in memory
        from collections import defaultdict
        msgs_by_conv = defaultdict(list)
        for m in msgs_res.data:
            msgs_by_conv[m["conversation_id"]].append({
                "id": m["id"],
                "role": m["role"],
                "content": m["message"],
                "sources": m["sources"] or [],
                "timestamp": m["created_at"]
            })
            
        for conv in convs_res.data:
            document_name = None
            if conv["document_id"]:
                doc = next((d for d in documents if d["id"] == conv["document_id"]), None)
                if doc:
                    document_name = doc["filename"]
                    
            conversations.append({
                "id": conv["id"],
                "title": conv["title"],
                "documentName": document_name,
                "createdAt": conv["created_at"],
                "updatedAt": conv["updated_at"],
                "messages": msgs_by_conv[conv["id"]]
            })
        
    return {
        "success": True,
        "documents": documents,
        "conversations": conversations
    }

# ── Document Chunks ────────────────────────────────────────────────────────────
@app.get("/document/chunks")
def get_document_chunks(filename: str, x_session_id: str = Header(None)):
    """
    Fetches all chunks for a specific document to display in the Document Reader.
    """
    if not x_session_id:
        raise HTTPException(status_code=400, detail="Missing x-session-id header")
    if not filename:
        raise HTTPException(status_code=400, detail="Missing filename parameter")
        
    vs = get_vector_store()
    
    # Verify document belongs to session
    doc_res = vs.client.table("documents").select("id").eq("filename", filename).eq("session_id", x_session_id).execute()
    if not doc_res.data:
        raise HTTPException(status_code=404, detail="Document not found")
        
    doc_id = doc_res.data[0]["id"]
    
    # Fetch chunks, exclude embedding vector
    chunks_res = vs.client.table("document_chunks").select("chunk_id, page_number, content").eq("document_id", doc_id).execute()
    
    chunks_data = chunks_res.data
    # Sort chunks numerically based on their ID suffix (e.g., filename_chunk_1)
    def get_chunk_num(c):
        try:
            return int(c["chunk_id"].split("_chunk_")[-1])
        except:
            return 0
    
    chunks_data.sort(key=get_chunk_num)
    
    return {
        "success": True,
        "filename": filename,
        "chunks": chunks_data
    }

# ── Upload ─────────────────────────────────────────────────────────────────────
@app.post("/upload")
async def upload_document(file: UploadFile = File(...), x_session_id: str = Header(None)):
    """
    Accepts PDF or TXT files. 
    Strictly validates MIME type, magic bytes, and enforces a 10 MB size limit in-memory.
    No temporary files are created on disk.
    """
    if not x_session_id:
        raise HTTPException(status_code=400, detail="Missing x-session-id header")
        
    filename = os.path.basename(file.filename)
    
    # 1. In-memory validation (MIME & Magic Bytes)
    header_bytes = await file.read(2048)
    await file.seek(0)
    
    if not validate_file_content(filename, file.content_type, header_bytes):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file content or format. Only PDF and TXT documents are allowed.",
        )
        
    # 2. Limit maximum file size to 10 MB in-memory
    max_size = 10 * 1024 * 1024  # 10 MB
    size = 0
    file_bytes_list = []
    
    while chunk := await file.read(1024 * 1024):  # Read in 1MB buffers
        size += len(chunk)
        if size > max_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File is too large. Maximum allowed size is 10 MB.",
            )
        file_bytes_list.append(chunk)
        
    file_bytes = b"".join(file_bytes_list)
    
    # Edge case: small files might fit entirely in first header_bytes read
    if not file_bytes and header_bytes:
        file_bytes = header_bytes
        
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty.",
        )

    vector_store = get_vector_store()

    # Return early if already indexed for this session
    if vector_store.is_file_indexed(filename, x_session_id):
        chunk_count = vector_store.count_chunks_for_file(filename, x_session_id)
        logger.info(f"[UPLOAD] Cache hit: '{filename}' ({chunk_count} chunks)")
        return {
            "success": True,
            "filename": filename,
            "chunks": chunk_count,
            "message": "File loaded from cache (already indexed).",
        }

    # Process file chunks and embeddings directly from memory
    try:
        logger.info(f"[UPLOAD] Indexing new file: '{filename}'")
        chunks = load_and_chunk_bytes(file_bytes, filename)

        if not chunks:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded document contains no readable text.",
            )

        emb_model = get_embedding_model()
        texts = [c["chunk_text"] for c in chunks]
        embeddings = emb_model.embed_documents(texts)
        vector_store.add_chunks(chunks, embeddings, x_session_id)

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
        logger.error(f"[UPLOAD] Indexing failed for '{filename}': {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process and index document: {exc}",
        )


# ── Chat ───────────────────────────────────────────────────────────────────────
@app.post("/chat")
def chat(request: ChatRequest, x_session_id: str = Header(None)):
    """
    RAG chat endpoint using Supabase.
    Escapes newlines during streaming to ensure markdown integrity.
    """
    if not x_session_id:
        raise HTTPException(status_code=400, detail="Missing x-session-id header")
        
    filename = request.filename
    if not filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active document. Please upload a document first.",
        )

    vector_store = get_vector_store()
    if not vector_store.is_file_indexed(filename, x_session_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document '{filename}' is not indexed. Please re-upload.",
        )

    # Manage conversation in Supabase
    conv_res = vector_store.client.table("conversations").select("*").eq("id", request.conversation_id).execute()
    
    # Get active document ID to sync
    doc_res = vector_store.client.table("documents").select("id").eq("filename", filename).eq("session_id", x_session_id).execute()
    doc_id = doc_res.data[0]["id"] if doc_res.data else None

    if not conv_res.data:
        # Auto generate title based on first prompt
        title = request.question.strip()[:50]
        if len(request.question.strip()) > 50:
            title += "…"
            
        vector_store.client.table("conversations").insert({
            "id": request.conversation_id,
            "session_id": x_session_id,
            "title": title,
            "document_id": doc_id
        }).execute()
    else:
        # Update updated_at timestamp to pull conversation to the top AND sync document_id
        vector_store.client.table("conversations").update({
            "updated_at": datetime.utcnow().isoformat(),
            "document_id": doc_id
        }).eq("id", request.conversation_id).execute()

    # Save user message
    vector_store.client.table("chat_messages").insert({
        "id": request.message_id + "_user",
        "session_id": x_session_id,
        "conversation_id": request.conversation_id,
        "role": "user",
        "message": request.question
    }).execute()

    # 1. Embed question
    emb_model = get_embedding_model()
    query_emb = emb_model.embed_query(request.question)

    # 2. Similarity search (top 5)
    top_k = int(os.getenv("TOP_K", 5))
    relevant_chunks = vector_store.query_similarity(query_emb, filename, x_session_id, top_k=top_k)

    # 3. No relevant chunks → deterministic fallback
    if not relevant_chunks:
        fallback = "I couldn't find that information in the uploaded document."
        
        # Save assistant message
        vector_store.client.table("chat_messages").insert({
            "id": request.message_id,
            "session_id": x_session_id,
            "conversation_id": request.conversation_id,
            "role": "assistant",
            "message": fallback,
            "sources": []
        }).execute()
        
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
            yield f"event: sources\ndata: {json.dumps(sources)}\n\n"

            answer_text = ""
            try:
                for token in generate_answer_stream(request.question, relevant_chunks):
                    # Escape newlines as literal \n sequences so they do not break the SSE framing.
                    # Frontend will reconstruct \n correctly for markdown parsing.
                    safe_token = token.replace("\n", "\\n")
                    yield f"event: text\ndata: {safe_token}\n\n"
                    answer_text += token

            except GeminiQuotaError:
                msg = (
                    "⚠️ Groq API quota exceeded. Your free-tier limit has been reached. "
                    "Please wait a minute and try again, or check your rate limits "
                    "in the Groq console."
                )
                yield f"event: text\ndata: {msg}\n\n"
                answer_text += msg

            except GeminiAPIError as exc:
                msg = f"⚠️ Groq API error. Check backend logs for details."
                yield f"event: text\ndata: {msg}\n\n"
                answer_text += msg
                
            # Save final streamed answer to the database
            vs = get_vector_store()
            vs.client.table("chat_messages").insert({
                "id": request.message_id,
                "session_id": x_session_id,
                "conversation_id": request.conversation_id,
                "role": "assistant",
                "message": answer_text,
                "sources": sources
            }).execute()

            yield "event: end\ndata: [DONE]\n\n"

        return StreamingResponse(sse_generator(), media_type="text/event-stream")

    # 4b. Non-streaming JSON
    result = generate_answer(request.question, relevant_chunks)

    if "error" in result:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "success": False,
                "error": result["error"],
                "details": result.get("details", ""),
                "sources": sources,
            },
        )

    # Save assistant message
    vector_store.client.table("chat_messages").insert({
        "id": request.message_id,
        "session_id": x_session_id,
        "conversation_id": request.conversation_id,
        "role": "assistant",
        "message": result["text"],
        "sources": sources
    }).execute()

    return {"answer": result["text"], "sources": sources}


# ── Reset / Clear session ───────────────────────────────────────────────────────
@app.post("/reset")
def reset_session(x_session_id: str = Header(None)):
    """Deletes all database data associated with the current session."""
    if not x_session_id:
        raise HTTPException(status_code=400, detail="Missing x-session-id header")
        
    vs = get_vector_store()
    
    # Cascades will automatically clean up chunks and messages
    vs.client.table("documents").delete().eq("session_id", x_session_id).execute()
    vs.client.table("conversations").delete().eq("session_id", x_session_id).execute()
    
    return {"success": True, "message": "Session data reset."}
