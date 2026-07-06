import React, { useState, useCallback } from 'react';
import axios from 'axios';
import Navbar from './components/Navbar';
import EmptyState from './components/EmptyState';
import UploadArea from './components/UploadArea';
import UploadProgress from './components/UploadProgress';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';

const API_BASE = 'http://localhost:8000';

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

export default function App() {
  const [activeFile, setActiveFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle | uploading | indexing | success | error
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // ── File Upload Handler ───────────────────────────────────────────────
  const handleFileSelect = useCallback(async (file) => {
    setUploadStatus('uploading');
    setUploadProgress(0);
    setUploadError(null);
    setPendingFile(file);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_BASE}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const pct = Math.round((progressEvent.loaded * 100) / (progressEvent.total || file.size));
          setUploadProgress(Math.min(pct, 95));
        },
      });

      setUploadStatus('indexing');
      // Give a brief moment so user can see the indexing phase visually
      await new Promise((r) => setTimeout(r, 500));
      setUploadProgress(100);

      if (response.data.success) {
        setUploadStatus('success');
        setActiveFile(response.data.filename);
        setMessages([]); // Reset chat on new document
      } else {
        throw new Error('Upload failed on the server.');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Upload failed.';
      setUploadStatus('error');
      setUploadError(msg);
    }
  }, []);

  // ── Reset / Clear Document ────────────────────────────────────────────
  const handleReset = useCallback(async () => {
    try {
      await axios.post(`${API_BASE}/clear`);
    } catch (_) { /* ignore */ }
    setActiveFile(null);
    setUploadStatus('idle');
    setUploadProgress(0);
    setUploadError(null);
    setPendingFile(null);
    setMessages([]);
    setInputValue('');
  }, []);

  // ── Chat Submit Handler (SSE Streaming) ───────────────────────────────
  const handleChatSubmit = useCallback(async () => {
    if (!inputValue.trim() || isChatLoading) return;

    const question = inputValue.trim();
    setInputValue('');
    setIsChatLoading(true);

    // Add user message immediately
    const userMsg = { id: generateId(), role: 'user', content: question, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);

    // Prepare placeholder for AI response (built up from stream)
    const assistantId = generateId();

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, filename: activeFile, stream: true }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.detail || `Server error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let sources = [];
      let answerText = '';

      // Insert empty AI message bubble to start building into
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '', sources: [], timestamp: new Date().toISOString() },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep partial line in buffer

        for (const line of lines) {
          if (line.startsWith('event: sources')) {
            // Next data line will be sources JSON
          } else if (line.startsWith('event: text')) {
            // Next data line will be a text token
          } else if (line.startsWith('event: end')) {
            // Stream finished
          } else if (line.startsWith('data: ')) {
            const data = line.slice(6); // Remove 'data: '
            if (data === '[DONE]') break;

            // Detect if this is the sources payload (JSON array) or a text chunk
            if (data.startsWith('[') || data.startsWith('{')) {
              try {
                const parsed = JSON.parse(data);
                if (Array.isArray(parsed)) {
                  sources = parsed;
                  // Update sources on message immediately
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId ? { ...m, sources } : m
                    )
                  );
                }
              } catch (_) {
                // Not valid JSON; treat as regular text
                answerText += data;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: answerText } : m
                  )
                );
              }
            } else {
              answerText += data;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: answerText } : m
                )
              );
            }
          }
        }
      }
    } catch (err) {
      const errorMsg = err.message || 'Something went wrong. Please try again.';
      setMessages((prev) => {
        const exists = prev.find((m) => m.id === assistantId);
        if (exists) {
          return prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: `⚠️ Error: ${errorMsg}` }
              : m
          );
        }
        return [
          ...prev,
          { id: assistantId, role: 'assistant', content: `⚠️ Error: ${errorMsg}`, sources: [], timestamp: new Date().toISOString() },
        ];
      });
    } finally {
      setIsChatLoading(false);
    }
  }, [inputValue, isChatLoading, activeFile]);

  // ── Clear Chat History ────────────────────────────────────────────────
  const handleClearHistory = useCallback(() => {
    setMessages([]);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────
  const showChat = activeFile && uploadStatus === 'success';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar activeFile={activeFile} onReset={handleReset} />

      <main className="flex-1 flex flex-col">
        {!showChat ? (
          /* ── Landing / Upload View ── */
          <EmptyState>
            <div className="space-y-4">
              <UploadArea onFileSelect={handleFileSelect} isUploading={uploadStatus === 'uploading' || uploadStatus === 'indexing'} />

              {uploadStatus !== 'idle' && (
                <UploadProgress
                  status={uploadStatus}
                  progress={uploadProgress}
                  filename={pendingFile?.name || ''}
                  error={uploadError}
                  onRetry={handleReset}
                />
              )}
            </div>
          </EmptyState>
        ) : (
          /* ── Chat View ── */
          <div className="flex flex-col flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-4 gap-3">
            <ChatWindow
              messages={messages}
              loading={isChatLoading}
              onClearHistory={handleClearHistory}
              activeFilename={activeFile}
            />
            <ChatInput
              value={inputValue}
              onChange={setInputValue}
              onSubmit={handleChatSubmit}
              disabled={isChatLoading}
              placeholder={`Ask a question about "${activeFile}"...`}
            />
          </div>
        )}
      </main>
    </div>
  );
}
