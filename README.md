# 📄 Document-Based AI Assistant

A production-ready **Retrieval-Augmented Generation (RAG)** application that allows users to upload PDF or TXT documents and ask AI-powered questions strictly grounded in the document's contents. No hallucinations. Full citations. All data is backed by a fully persistent, anonymous session system.

---

## 🏗 Architecture

```
User Browser (localStorage docai_session)
     │
     ▼
┌──────────────────────────────────┐
│  React Frontend (Vite + Tailwind)│
│  Deployed on Vercel              │
│  ┌────────────┐  ┌─────────────┐ │
│  │ Upload UI  │  │  Chat UI    │ │
│  │ Drag/Drop  │  │  Streaming  │ │
│  └────────────┘  └─────────────┘ │
└──────────────┬───────────────────┘
               │ HTTP / SSE (with x-session-id)
               ▼
┌──────────────────────────────────┐
│  FastAPI Backend                 │
│  Deployed on Render              │
│                                  │
│  POST /upload                    │
│   └─► document_loader.py         │
│   └─► Chunking & Embeddings      │
│   └─► vector_store.py → Supabase │
│                                  │
│  POST /chat                      │
│   └─► Embed question             │
│   └─► Supabase Similarity Search │
│   └─► rag.py → Gemini API        │
│   └─► SSE stream back to browser │
└──────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│  Supabase (PostgreSQL + pgvector)│
│  Deployed on Supabase            │
│  Tables: documents, chunks,      │
│          conversations, messages │
└──────────────────────────────────┘
```

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS (Vercel) |
| HTTP Client | Axios |
| Backend | FastAPI, Python 3.11 (Render) |
| PDF Parsing | PyMuPDF (fitz) |
| Embedding | sentence-transformers/all-MiniLM-L6-v2 |
| Vector DB | Supabase PostgreSQL with `pgvector` |
| LLM | Google Gemini 1.5 Flash |
| Streaming | Server-Sent Events (SSE) |

---

## ⚙️ Installation & Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- A [Google Gemini API Key](https://ai.google.dev/)
- A [Supabase](https://supabase.com/) Project

---

### 1. Database Setup (Supabase)

1. Create a new Supabase project.
2. Go to the SQL Editor in your Supabase dashboard.
3. Copy the contents of `backend/schema.sql` and run it to create all necessary tables, functions, and the `pgvector` extension.

---

### 2. Backend Setup

```bash
cd document-ai-assistant/backend

# Create a virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
```

Edit `.env` and set:
```env
GEMINI_API_KEY=your_google_gemini_api_key_here
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**Start the backend:**
```bash
uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```

---

### 3. Frontend Setup

```bash
cd document-ai-assistant/frontend

# Install packages
npm install

# Start the dev server
npm run dev
```

---

## 🔐 Environment Variables

### Backend (`backend/.env`)
- `GEMINI_API_KEY`: API Key for Google Gemini LLM.
- `SUPABASE_URL`: The URL for your Supabase project.
- `SUPABASE_SERVICE_ROLE_KEY`: The Service Role key for your Supabase project (used for backend db access).
- `ALLOWED_ORIGINS`: Comma separated list of allowed CORS origins (for Render deployment).

### Frontend (`frontend/.env`)
- `VITE_API_URL`: The URL to your FastAPI backend (default: `http://localhost:8000`).

---

## 🔬 How It Works

### Anonymous Session System
When a user visits the app for the first time, a random UUID is generated and stored in their browser's `localStorage` (`docai_session`). Every request to the backend includes this UUID via the `x-session-id` header. 

This enables a completely anonymous, yet persistent experience similar to ChatGPT:
- Refreshing the page automatically restores previous conversations, uploaded documents, and chat history.
- Everything is stored in Supabase under that `session_id`.
- Clicking "Reset" only deletes the data belonging to the current user.

### Document Chunking & Embeddings
Uploaded documents are split into overlapping text chunks (700 chars, 150 char overlap) and embedded using the local `sentence-transformers/all-MiniLM-L6-v2` model into 384-dimensional dense vectors.

### Supabase `pgvector` Retrieval
Embeddings are stored in Supabase alongside document metadata. When asking a question:
1. The question is embedded using the MiniLM model.
2. A custom PostgreSQL RPC function (`match_document_chunks`) performs an exact cosine similarity search across the vector index.
3. The top 5 chunks are retrieved and sent to Gemini.

### LLM Generation (Gemini)
Gemini receives a strict system prompt enforcing citations and preventing hallucinations. The response is streamed token-by-token using SSE back to the browser.

---

## 🚀 Deployment

The application is fully production-ready for deployment:

- **Frontend**: Deploy `frontend/` to **Vercel**. Set the `VITE_API_URL` environment variable to your Render backend URL.
- **Backend**: Deploy `backend/` to **Render** using a Web Service. Set the environment variables `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `ALLOWED_ORIGINS` (pointing to your Vercel URL).
- **Database**: Use your **Supabase** project. Ensure `schema.sql` is fully executed.

---

## 📸 Screenshots

> _Start the app and upload a PDF to see the full interface in action._

---

## 📄 License

MIT — free to use, modify, and deploy.
