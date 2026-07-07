# 🚀 Document-Based AI Assistant (RAG)

> AI-powered Document Question Answering using **FastAPI + React + Supabase Vector + Google Gemini + Groq + RAG**

A production-ready **Retrieval-Augmented Generation (RAG)** application that enables users to upload PDF or TXT documents and ask natural language questions. Responses are generated **strictly from the uploaded document**, with **source citations**, **persistent chat history**, and **anonymous sessions**—similar to ChatGPT, but without requiring login.

---

# 🌐 Live Demo

### 🖥 Frontend
https://document-based-ai-assistant.vercel.app/

### ⚡ Backend API
https://document-based-ai-assistant.onrender.com

---

# ✨ Features

## 📄 Document Processing

- 📂 Drag & Drop PDF/TXT Upload
- 📊 Upload Progress Indicator
- ✂ Intelligent Text Chunking
- 🧠 Local Embedding Generation (MiniLM-L6-v2)
- ⚡ Persistent Vector Storage using Supabase pgvector

---

## 🤖 AI Assistant

- 💬 ChatGPT-like Interface
- 🧠 RAG (Retrieval-Augmented Generation)
- 📚 Grounded Answers Only
- 🚫 No Hallucinations
- 📑 Source Citations with Page Numbers
- ⚡ Streaming AI Responses
- 📋 Copy Response
- 📥 Download Chat as Markdown

---

## 💾 Persistent Sessions

No Login Required.

Each visitor automatically receives an anonymous session ID.

The application remembers:

- Uploaded Documents
- Conversations
- Current Chat
- Chat History
- Active Document

Even after refreshing the browser.

---

## 🎨 Modern UI

- Responsive Design
- Mobile Friendly
- Dark Mode
- Beautiful Dashboard
- Sidebar Conversations
- Loading Skeletons
- Empty States
- Smooth Animations

---

# 🏗 Architecture

```
                   Browser
                      │
                      ▼
          React + Tailwind CSS
          (Vite • Vercel)

                      │
         HTTP + Server Sent Events
                      │
                      ▼

              FastAPI Backend
                 (Render)

      ┌──────────────┬──────────────┐
      ▼              ▼              ▼

 Document Loader   Embeddings     LLM

  PyMuPDF        MiniLM-L6-v2   Gemini / Groq

      │
      ▼

 Supabase PostgreSQL + pgvector

      │

 Document Chunks
 Chat History
 Conversations
 Anonymous Sessions
```

---

# 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | React 18 |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Backend | FastAPI |
| Language | Python 3.11 |
| PDF Parser | PyMuPDF |
| Embeddings | sentence-transformers (MiniLM-L6-v2) |
| Vector Database | Supabase pgvector |
| Database | PostgreSQL |
| AI Models | Google Gemini & Groq |
| Streaming | Server-Sent Events (SSE) |
| Deployment | Vercel + Render + Supabase |

---

# 🧠 RAG Pipeline

```
Upload Document
        │
        ▼
Extract Text
        │
        ▼
Chunk Document
        │
        ▼
Generate Embeddings
        │
        ▼
Store in Supabase pgvector
        │
        ▼
User asks Question
        │
        ▼
Embed Question
        │
        ▼
Vector Similarity Search
        │
        ▼
Retrieve Top Relevant Chunks
        │
        ▼
Gemini / Groq
        │
        ▼
Grounded Answer + Citations
```

---

# 🔥 Anonymous Session System

Unlike traditional applications, this project **does not require authentication**.

On the first visit:

- A UUID is generated
- Stored in browser localStorage
- Sent with every request

This allows the application to restore:

- Conversations
- Uploaded Files
- Chat History
- Active Document

Exactly like ChatGPT's anonymous mode.

---

# 📂 Project Structure

```
document-ai-assistant

├── backend
│   ├── app.py
│   ├── rag.py
│   ├── vector_store.py
│   ├── embeddings.py
│   ├── document_loader.py
│   ├── schema.sql
│   └── requirements.txt
│
├── frontend
│   ├── src
│   ├── components
│   ├── pages
│   └── package.json
│
└── README.md
```

---

# ⚙ Environment Variables

## Backend

```env
SUPABASE_URL=

SUPABASE_SERVICE_ROLE_KEY=

GEMINI_API_KEY=

GROQ_API_KEY=

MODEL_NAME=
```

---

## Frontend

```env
VITE_API_URL=https://document-based-ai-assistant.onrender.com
```

---

# 🚀 Local Installation

## Clone

```bash
git clone <repository-url>

cd document-ai-assistant
```

---

## Backend

```bash
cd backend

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt

uvicorn app:app --reload
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

---

# 🌍 Deployment

## Frontend

- Vercel

## Backend

- Render

## Database

- Supabase PostgreSQL + pgvector

---

# 📊 Key Highlights

- ✅ Production Ready
- ✅ Retrieval-Augmented Generation (RAG)
- ✅ Persistent Vector Database
- ✅ ChatGPT-like Anonymous Sessions
- ✅ Source Citations
- ✅ Streaming Responses
- ✅ Mobile Responsive
- ✅ Modern UI/UX
- ✅ Fast Semantic Search
- ✅ Cloud Deployment

---

# 📸 Screenshots

Add screenshots here.

Example:

```
screenshots/

home.png

chat.png

upload.png

mobile.png
```

---

# 🔮 Future Improvements

- Multi-document Search
- OCR Support
- Image-based PDFs
- Voice Input
- Conversation Sharing
- Workspace Support
- Authentication
- Team Collaboration
- AI-generated Summaries
- Document Comparison

---

# 👨‍💻 Developer

**Rag Raichura**

B.Tech Computer Engineering

AI / ML Enthusiast

Full Stack Developer

GitHub: https://github.com/rag2504

Portfolio: https://rags-portfolio.netlify.app/

---

# ⭐ If you like this project

Please consider giving it a ⭐ on GitHub.

It really helps!
