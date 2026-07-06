import React, { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import WelcomeScreen from './components/WelcomeScreen';
import ChatArea from './components/ChatArea';
import ChatInput from './components/ChatInput';
import { useTheme } from './hooks/useTheme';
import { useConversations } from './hooks/useConversations';

const API_BASE = 'http://localhost:8000';

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

// ── Persist sidebar state ──
function getSidebarDefault() {
  try {
    const stored = localStorage.getItem('docai_sidebar_open');
    if (stored !== null) return stored === 'true';
  } catch { /* ignore */ }
  return window.innerWidth >= 768;
}

// ── Persist active document state ──
function getStoredDocument() {
  try {
    return JSON.parse(localStorage.getItem('docai_active_doc') || 'null');
  } catch { return null; }
}

function storeDocument(doc) {
  try {
    localStorage.setItem('docai_active_doc', doc ? JSON.stringify(doc) : 'null');
  } catch { /* ignore */ }
}

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const {
    conversations, activeConversation, activeId,
    createNewChat, addMessage, updateLastAssistantMessage,
    clearMessages, deleteConversation, renameConversation,
    switchConversation, setDocumentName,
  } = useConversations();

  const [sidebarOpen, setSidebarOpen] = useState(getSidebarDefault);

  // Document state
  const [activeDoc, setActiveDoc] = useState(() => getStoredDocument());
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle | uploading | indexing | success | error
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [uploadedAt, setUploadedAt] = useState(null);

  // Chat state
  const [inputValue, setInputValue] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState(null);

  // Persist sidebar state
  useEffect(() => {
    try { localStorage.setItem('docai_sidebar_open', sidebarOpen); } catch { /* ignore */ }
  }, [sidebarOpen]);

  // Persist active document
  useEffect(() => {
    storeDocument(activeDoc);
  }, [activeDoc]);

  // Messages from active conversation
  const messages = activeConversation?.messages || [];
  const activeFilename = activeDoc?.filename || null;

  // ── Ensure there's always an active conversation if we have a document ──
  const ensureConversation = useCallback(() => {
    if (!activeId) {
      return createNewChat(activeFilename);
    }
    return activeId;
  }, [activeId, createNewChat, activeFilename]);

  // ── File Upload ──
  const handleFileSelect = useCallback(async (file) => {
    setUploadStatus('uploading');
    setUploadProgress(0);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_BASE}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          const pct = Math.round((event.loaded * 100) / (event.total || file.size));
          setUploadProgress(Math.min(pct, 95));
        },
      });

      setUploadStatus('indexing');
      await new Promise((r) => setTimeout(r, 600));
      setUploadProgress(100);

      if (response.data.success) {
        setUploadStatus('success');
        const doc = {
          filename: response.data.filename,
          chunks: response.data.chunks,
          uploadedAt: new Date().toISOString(),
        };
        setActiveDoc(doc);
        setUploadedAt(doc.uploadedAt);

        // Create or update active conversation with document name
        const convId = activeId || createNewChat(response.data.filename);
        if (activeId) setDocumentName(response.data.filename);
      } else {
        throw new Error('Upload failed on the server.');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Upload failed.';
      setUploadStatus('error');
      setUploadError(msg);
    }
  }, [activeId, createNewChat, setDocumentName]);

  // ── Reset / Replace Document ──
  const handleReset = useCallback(async () => {
    try { await axios.post(`${API_BASE}/clear`); } catch { /* ignore */ }
    setActiveDoc(null);
    setUploadStatus('idle');
    setUploadProgress(0);
    setUploadError(null);
    setUploadedAt(null);
    setInputValue('');
    storeDocument(null);
  }, []);

  // ── Chat Submit (SSE Streaming) ──
  const handleChatSubmit = useCallback(async (overrideQuestion) => {
    const question = (overrideQuestion || inputValue).trim();
    if (!question || isChatLoading) return;

    // Ensure we have an active conversation
    let convId = activeId;
    if (!convId) convId = createNewChat(activeFilename);

    setInputValue('');
    setIsChatLoading(true);

    // Add user message
    const userMsg = {
      id: generateId(),
      role: 'user',
      content: question,
      timestamp: new Date().toISOString(),
    };
    addMessage(userMsg);

    // Placeholder AI message
    const assistantId = generateId();
    setStreamingMessageId(assistantId);

    const assistantMsg = {
      id: assistantId,
      role: 'assistant',
      content: '',
      sources: [],
      timestamp: new Date().toISOString(),
    };

    // Small delay so typing indicator shows briefly
    await new Promise((r) => setTimeout(r, 120));
    addMessage(assistantMsg);

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, filename: activeFilename, stream: true }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.detail || `Server error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let answerText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;

            if (data.startsWith('[') || data.startsWith('{')) {
              try {
                const parsed = JSON.parse(data);
                if (Array.isArray(parsed)) {
                  updateLastAssistantMessage((m) => ({ ...m, sources: parsed }));
                }
              } catch {
                answerText += data;
                updateLastAssistantMessage((m) => ({ ...m, content: answerText }));
              }
            } else {
              answerText += data;
              updateLastAssistantMessage((m) => ({ ...m, content: answerText }));
            }
          }
        }
      }
    } catch (err) {
      const errorMsg = err.message || 'Something went wrong. Please try again.';
      updateLastAssistantMessage((m) => ({
        ...m,
        content: `⚠️ **Error:** ${errorMsg}`,
      }));
    } finally {
      setIsChatLoading(false);
      setStreamingMessageId(null);
    }
  }, [inputValue, isChatLoading, activeId, activeFilename, createNewChat, addMessage, updateLastAssistantMessage]);

  // ── Regenerate last response ──
  const handleRegenerate = useCallback(() => {
    // Find last user message and re-submit
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUser && !isChatLoading) {
      // Remove the last assistant message
      // We achieve this by just resubmitting; the updateLastAssistantMessage will overwrite
      handleChatSubmit(lastUser.content);
    }
  }, [messages, isChatLoading, handleChatSubmit]);

  // ── New Chat ──
  const handleNewChat = useCallback(() => {
    createNewChat(activeFilename);
  }, [createNewChat, activeFilename]);

  // ── Clear current chat ──
  const handleClearChat = useCallback(() => {
    clearMessages();
  }, [clearMessages]);

  // ── Download chat as Markdown ──
  const handleDownloadChat = useCallback(() => {
    if (!messages.length) return;
    let md = `# Chat Transcript – Document AI Assistant\n`;
    md += `**Document:** ${activeFilename || 'Unknown'}\n`;
    md += `**Date:** ${new Date().toLocaleString()}\n\n---\n\n`;

    messages.forEach((msg) => {
      const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (msg.role === 'user') {
        md += `### 👤 You (${time})\n\n${msg.content}\n\n`;
      } else {
        md += `### ✦ DocAI (${time})\n\n${msg.content}\n\n`;
        if (msg.sources?.length) {
          md += `**Sources:**\n`;
          msg.sources.forEach((s) => {
            md += `- Page ${s.page} · Chunk ${s.chunk_id?.split('_')?.pop() || s.chunk_id}: *"${s.text?.slice(0, 200)}"*\n`;
          });
          md += '\n';
        }
        md += `---\n\n`;
      }
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat_${(activeFilename || 'transcript').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [messages, activeFilename]);

  const showChat = activeDoc && uploadStatus === 'success';

  return (
    <div className="main-layout" data-theme={theme}>
      {/* ── Sidebar ── */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        conversations={conversations}
        activeId={activeId}
        onNewChat={handleNewChat}
        onSwitchChat={(id) => { switchConversation(id); setSidebarOpen(false); }}
        onDeleteChat={deleteConversation}
        onRenameChat={renameConversation}
        activeDocument={activeFilename}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* ── Main content ── */}
      <div
        className={`main-content ${sidebarOpen ? '' : 'sidebar-collapsed'}`}
        style={{
          marginLeft: sidebarOpen ? '280px' : '0',
          transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Header */}
        <Header
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          activeDocument={activeFilename}
          onNewChat={handleNewChat}
          onClearChat={handleClearChat}
          onDownloadChat={handleDownloadChat}
          hasMessages={messages.length > 0}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {/* Page content */}
        {!showChat ? (
          <WelcomeScreen
            onFileSelect={handleFileSelect}
            onSuggestedPrompt={(prompt) => {
              // If we have a document ready, switch to chat and submit
              if (activeDoc && uploadStatus === 'success') {
                setInputValue(prompt);
              }
            }}
            uploadStatus={uploadStatus}
            uploadProgress={uploadProgress}
            uploadError={uploadError}
            onRetry={handleReset}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
            <ChatArea
              messages={messages}
              isChatLoading={isChatLoading}
              streamingMessageId={streamingMessageId}
              activeFilename={activeFilename}
              uploadChunks={activeDoc?.chunks}
              uploadedAt={activeDoc?.uploadedAt}
              onSuggestedPrompt={(prompt) => handleChatSubmit(prompt)}
              onRegenerate={handleRegenerate}
              onReplace={handleReset}
            />
            <ChatInput
              value={inputValue}
              onChange={setInputValue}
              onSubmit={handleChatSubmit}
              disabled={isChatLoading}
              placeholder={`Ask a question about "${activeFilename}"…`}
              onAttach={handleFileSelect}
            />
          </div>
        )}
      </div>
    </div>
  );
}
