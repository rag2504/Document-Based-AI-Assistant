# 📄 Document-Based AI Assistant

A production-ready **Retrieval-Augmented Generation (RAG)** application that allows users to upload PDF or TXT documents and ask AI-powered questions strictly grounded in the document's contents. No hallucinations. Full citations.

---

## 🏗 Architecture

```
User Browser
     │
     ▼
┌──────────────────────────────────┐
│  React Frontend (Vite + Tailwind)│
│  ┌────────────┐  ┌─────────────┐ │
│  │ Upload UI  │  │  Chat UI    │ │
│  │ Drag/Drop  │  │  Streaming  │ │
│  └────────────┘  └─────────────┘ │
└──────────────┬───────────────────┘
               │ HTTP / SSE
               ▼
┌──────────────────────────────────┐
│  FastAPI Backend                 │
│                                  │
│  POST /upload                    │
│   └─► document_loader.py         │
│        ├─ PyMuPDF (PDF)          │
│        └─ plain text (TXT)       │
│   └─► Chunking (700 / 150 chars) │
│   └─► embeddings.py              │
│        └─ all-MiniLM-L6-v2       │
│   └─► vector_store.py → ChromaDB │
│                                  │
│  POST /chat                      │
│   └─► Embed question             │
│   └─► Similarity search (Top 5) │
│   └─► rag.py → Gemini API        │
│   └─► SSE stream back to browser │
└──────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│  Persistent ChromaDB             │
│  Collection: "documents"         │
│  Storage:    backend/chroma_db/  │
└──────────────────────────────────┘
```

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| HTTP Client | Axios |
| Markdown | react-markdown |
| Icons | lucide-react |
| Backend | FastAPI, Python 3.11 |
| PDF Parsing | PyMuPDF (fitz) |
| Chunking | Custom sliding-window |
| Embedding | sentence-transformers/all-MiniLM-L6-v2 |
| Vector DB | ChromaDB (persistent) |
| LLM | Google Gemini 1.5 Flash |
| Streaming | Server-Sent Events (SSE) |

---

## 📁 Folder Structure

```
document-ai-assistant/
├── backend/
│   ├── app.py               # FastAPI entry point
│   ├── rag.py               # Gemini LLM generation
│   ├── embeddings.py        # SentenceTransformer model
│   ├── document_loader.py   # PDF/TXT parsing & chunking
│   ├── vector_store.py      # ChromaDB interface
│   ├── prompts.py           # System & user prompt templates
│   ├── utils.py             # File validation helpers
│   ├── uploads/             # Saved uploaded documents
│   ├── chroma_db/           # Persistent vector database
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── UploadArea.jsx
│   │   │   ├── UploadProgress.jsx
│   │   │   ├── ChatWindow.jsx
│   │   │   ├── ChatInput.jsx
│   │   │   ├── MessageBubble.jsx
│   │   │   ├── SourceAccordion.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   └── LoadingSkeleton.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vite.config.js
└── README.md
```

---

## ⚙️ Installation & Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- A [Google Gemini API Key](https://ai.google.dev/)

---

### 1. Backend Setup

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
# Edit .env and set your GEMINI_API_KEY
```

**Start the backend:**

```bash
uvicorn app:app --reload --port 8000
```

The API will be live at: `http://localhost:8000`

---

### 2. Frontend Setup

```bash
cd document-ai-assistant/frontend

# Install packages
npm install

# Start the dev server
npm run dev
```

The app will open at: `http://localhost:5173`

---

## 🔐 Environment Variables

Create `backend/.env` with:

```env
# Required
GEMINI_API_KEY=your_google_gemini_api_key_here
```

---

## 🔬 How It Works

### Document Chunking

Uploaded documents are split into **overlapping text chunks** using a sliding window algorithm:

- **Chunk Size:** 700 characters
- **Overlap:** 150 characters

Each chunk stores: `chunk_id`, `page_number`, `filename`, and `chunk_text`.

This ensures context continuity across chunk boundaries so no information is lost.

---

### Embeddings

Text chunks (and user queries) are converted into **384-dimensional dense vectors** using the `sentence-transformers/all-MiniLM-L6-v2` model, which runs locally without any external API calls.

The model is loaded once on startup and reused for all requests (singleton pattern).

---

### Retrieval

When the user asks a question:
1. The question is embedded using the same MiniLM model.
2. ChromaDB performs a **cosine similarity search** against all stored chunk embeddings filtered by the active filename.
3. The **top 5** most relevant chunks are retrieved and formatted as context.

---

### ChromaDB (Persistent Storage)

Embeddings are stored in a **persistent ChromaDB** instance at `backend/chroma_db/`. This means:

- ✅ Embeddings survive backend restarts.
- ✅ Re-uploading the same file skips re-indexing (cache check by filename).
- ✅ No wasted compute.

---

### LLM Generation (Gemini)

The retrieved chunks are passed to **Google Gemini 1.5 Flash** alongside a strict system prompt that enforces:

- Answer only using the provided context.
- Never use outside knowledge.
- Respond with a specific fallback message if the answer is not found.
- Include page numbers wherever possible.

Responses are **streamed token-by-token** back to the browser via Server-Sent Events (SSE).

---

## 📡 API Documentation

### `POST /upload`

Upload a document for indexing.

**Request:** `multipart/form-data` with field `file` (PDF or TXT).

**Response:**
```json
{
  "success": true,
  "filename": "sample.pdf",
  "chunks": 148,
  "message": "File uploaded and indexed successfully."
}
```

---

### `POST /chat`

Ask a question about the indexed document (SSE streaming).

**Request body:**
```json
{
  "question": "What is the refund policy?",
  "filename": "sample.pdf",
  "stream": true
}
```

**SSE Events:**
| Event | Data |
|---|---|
| `sources` | JSON array of top-5 relevant chunks |
| `text` | Streaming tokens from Gemini |
| `end` | `[DONE]` signal |

---

### `POST /clear`

Reset the active document session.

**Response:**
```json
{ "success": true, "message": "Active document reset." }
```

---

## 🚀 Features

- ✅ Drag & drop or browse file upload
- ✅ Real-time upload & indexing progress
- ✅ Cached indexing (no re-embedding same file)
- ✅ SSE streaming chat responses
- ✅ Grounded answers with zero hallucination
- ✅ Page-level citation sources
- ✅ Collapsible source accordion
- ✅ Copy AI response to clipboard
- ✅ Download full conversation as Markdown
- ✅ Clear chat history
- ✅ Responsive design (desktop, tablet, mobile)
- ✅ Loading skeletons & typing animations

---

## 📈 Future Improvements

- [ ] Multi-document support with active document switching
- [ ] OpenAI GPT-4o model as an alternative backend
- [ ] User authentication and per-user document isolation
- [ ] Document summary generation on upload
- [ ] Highlight the exact sentence from the PDF that sourced the answer
- [ ] Re-ranking retrieved chunks with a cross-encoder
- [ ] Support for DOCX, Markdown, and HTML documents
- [ ] Docker Compose deployment configuration
- [ ] Cloud deployment guide (Render, Railway, Vercel)

---

## 📸 Screenshots

> _Start the app and upload a PDF to see the full interface in action._

---

## 📄 License

MIT — free to use, modify, and deploy.
