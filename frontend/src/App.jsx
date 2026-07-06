import React, { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { AnimatePresence } from 'framer-motion';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import WelcomeScreen from './components/WelcomeScreen';
import ChatArea from './components/ChatArea';
import ChatInput from './components/ChatInput';
import DocumentPanel from './components/DocumentPanel';
import CommandPalette from './components/CommandPalette';
import KeyboardShortcuts from './components/KeyboardShortcuts';

import { useTheme } from './hooks/useTheme';
import { useConversations } from './hooks/useConversations';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 10);
}

// ── Session ID ────────────────────────────────────────────────────────────────
function getSessionId() {
  let sid = localStorage.getItem('docai_session');
  if (!sid) {
    sid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    localStorage.setItem('docai_session', sid);
  }
  return sid;
}

axios.interceptors.request.use((config) => {
  config.headers['x-session-id'] = getSessionId();
  return config;
});

// ── Persist helpers ───────────────────────────────────────────────────────────
function getSidebarDefault() {
  try {
    const stored = localStorage.getItem('docai_sidebar_open');
    if (stored !== null) return stored === 'true';
  } catch { /* ignore */ }
  return window.innerWidth >= 1024;
}

function getStoredDocument() {
  try { return JSON.parse(localStorage.getItem('docai_active_doc') || 'null'); }
  catch { return null; }
}

function storeDocument(doc) {
  try { localStorage.setItem('docai_active_doc', doc ? JSON.stringify(doc) : 'null'); }
  catch { /* ignore */ }
}

// ── Mobile detection ──────────────────────────────────────────────────────────
function isMobileViewport() {
  return window.innerWidth < 768;
}

// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const { theme, toggleTheme } = useTheme();
  const {
    conversations, activeConversation, activeId, setServerData,
    createNewChat, addMessage, updateLastAssistantMessage,
    clearMessages, deleteConversation, renameConversation,
    switchConversation, setDocumentName, setActiveId, pinConversation,
  } = useConversations();

  // Layout state
  const [sidebarOpen, setSidebarOpen] = useState(getSidebarDefault);
  const [isMobile, setIsMobile] = useState(isMobileViewport);
  const [hoveredCitationId, setHoveredCitationId] = useState(null);

  // Document state
  const [activeDoc, setActiveDoc] = useState(() => getStoredDocument());
  const [uploadStatus, setUploadStatus] = useState(activeDoc ? 'success' : 'idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);

  // Chat state
  const [inputValue, setInputValue] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState(null);

  const handleCitationHover = useCallback((id) => {
    setHoveredCitationId(id);
  }, []);

  // Overlay state
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Responsive listener
  useEffect(() => {
    const handle = () => {
      const mobile = isMobileViewport();
      setIsMobile(mobile);
      if (!mobile && !sidebarOpen) setSidebarOpen(true);
    };
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, [sidebarOpen]);

  // Persist sidebar state
  useEffect(() => {
    try { localStorage.setItem('docai_sidebar_open', sidebarOpen); } catch { /* ignore */ }
  }, [sidebarOpen]);

  // Persist active document
  useEffect(() => { storeDocument(activeDoc); }, [activeDoc]);

  // Load session data on mount
  useEffect(() => {
    async function loadData() {
      try {
        const response = await axios.get(`${API_BASE}/session/data`);
        if (response.data.success) {
          setServerData(response.data.conversations);
          if (response.data.documents?.length > 0) {
            const latestDoc = response.data.documents[0];
            const docInfo = {
              filename: latestDoc.filename,
              chunks: latestDoc.chunk_count,
              uploadedAt: latestDoc.uploaded_at,
            };
            setActiveDoc(docInfo);
            setUploadStatus('success');
            storeDocument(docInfo);
          }
        }
      } catch (err) {
        console.error('Failed to load session data', err);
      }
    }
    loadData();
  }, [setServerData]);

  // ── Global keyboard shortcuts ──────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e) => {
      // Command palette: Ctrl/Cmd + K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCmdPaletteOpen(v => !v);
      }
      // Shortcuts modal: ?
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        setShortcutsOpen(v => !v);
      }
      // New chat: N (outside inputs)
      if (e.key === 'n' && !e.ctrlKey && !e.metaKey && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        handleNewChat();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // ── Derived ────────────────────────────────────────────────────────────────
  const messages = activeConversation?.messages || [];
  const activeFilename = activeDoc?.filename || null;
  const showChat = activeDoc && uploadStatus === 'success';

  // ── File Upload ────────────────────────────────────────────────────────────
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
          setUploadProgress(Math.min(pct, 90));
        },
      });

      setUploadStatus('indexing');
      await new Promise(r => setTimeout(r, 600));
      setUploadProgress(100);

      if (response.data.success) {
        setUploadStatus('success');
        const doc = {
          filename: response.data.filename,
          chunks: response.data.chunks,
          uploadedAt: new Date().toISOString(),
        };
        setActiveDoc(doc);

        const convId = activeId || createNewChat(response.data.filename);
        if (activeId) setDocumentName(response.data.filename);
      } else {
        throw new Error('Upload failed on the server.');
      }
    } catch (err) {
      const data = err.response?.data;
      let msg = 'Upload failed.';
      if (data) {
        if (data.error && data.details) {
          msg = `${data.error} — ${data.details}`;
        } else {
          msg = data.error || data.detail || msg;
        }
      } else {
        msg = err.message || msg;
      }
      setUploadStatus('error');
      setUploadError(msg);
    }
  }, [activeId, createNewChat, setDocumentName]);

  // ── Reset / Replace ────────────────────────────────────────────────────────
  const handleReset = useCallback(async () => {
    try { await axios.post(`${API_BASE}/reset`); } catch { /* ignore */ }
    setActiveDoc(null);
    setUploadStatus('idle');
    setUploadProgress(0);
    setUploadError(null);
    setInputValue('');
    storeDocument(null);
    setServerData([]);
    localStorage.removeItem('docai_active_conversation');
  }, [setServerData]);

  // ── Chat Submit (SSE Streaming) ───────────────────────────────────────────
  const handleChatSubmit = useCallback(async (overrideQuestion) => {
    const question = (overrideQuestion || inputValue).trim();
    if (!question || isChatLoading) return;

    let convId = activeId;
    if (!convId) convId = createNewChat(activeFilename);

    setInputValue('');
    setIsChatLoading(true);

    const userMsg = {
      id: generateId(),
      role: 'user',
      content: question,
      timestamp: new Date().toISOString(),
    };
    addMessage(userMsg);

    const assistantId = generateId();
    setStreamingMessageId(assistantId);

    const assistantMsg = {
      id: assistantId,
      role: 'assistant',
      content: '',
      sources: [],
      timestamp: new Date().toISOString(),
    };

    await new Promise(r => setTimeout(r, 100));
    addMessage(assistantMsg);

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': getSessionId(),
        },
        body: JSON.stringify({
          question,
          filename: activeFilename,
          stream: true,
          conversation_id: convId,
          message_id: assistantId,
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || errBody.detail || `Server error: ${response.status}`);
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
                  updateLastAssistantMessage(m => ({ ...m, sources: parsed }));
                  continue;
                }
              } catch (err) {
                console.error('Failed to parse JSON, treating as text:', err);
              }
            }

            const unescapedData = data.replace(/\\n/g, '\n');
            answerText += unescapedData;
            updateLastAssistantMessage(m => ({ ...m, content: answerText }));
          }
        }
      }
    } catch (err) {
      const errorMsg = err.message || 'Something went wrong. Please try again.';
      updateLastAssistantMessage(m => ({
        ...m,
        content: `> ⚠️ **Error:** ${errorMsg}`,
      }));
    } finally {
      setIsChatLoading(false);
      setStreamingMessageId(null);
    }
  }, [inputValue, isChatLoading, activeId, activeFilename, createNewChat, addMessage, updateLastAssistantMessage]);

  // ── Regenerate ────────────────────────────────────────────────────────────
  const handleRegenerate = useCallback(() => {
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    if (lastUser && !isChatLoading) {
      handleChatSubmit(lastUser.content);
    }
  }, [messages, isChatLoading, handleChatSubmit]);

  // ── New Chat ──────────────────────────────────────────────────────────────
  const handleNewChat = useCallback(() => {
    createNewChat(activeFilename);
  }, [createNewChat, activeFilename]);

  // ── Clear Chat ────────────────────────────────────────────────────────────
  const handleClearChat = useCallback(() => {
    clearMessages();
  }, [clearMessages]);

  // ── Download Chat ─────────────────────────────────────────────────────────
  const handleDownloadChat = useCallback(() => {
    if (!messages.length) return;
    let md = `# Chat Transcript — Omnidoc\n`;
    md += `**Document:** ${activeFilename || 'Unknown'}\n`;
    md += `**Date:** ${new Date().toLocaleString()}\n\n---\n\n`;
    messages.forEach(msg => {
      const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (msg.role === 'user') {
        md += `### 👤 You (${time})\n\n${msg.content}\n\n`;
      } else {
        md += `### ✦ Omnidoc (${time})\n\n${msg.content}\n\n`;
        if (msg.sources?.length) {
          md += `**Sources:**\n`;
          msg.sources.forEach(s => {
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
    link.download = `omnidoc_${(activeFilename || 'chat').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [messages, activeFilename]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="app-shell" data-theme={theme}>
      {/* ── Sidebar ── */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        conversations={conversations}
        activeId={activeId}
        onNewChat={handleNewChat}
        onSwitchChat={id => { switchConversation(id); if (isMobile) setSidebarOpen(false); }}
        onDeleteChat={deleteConversation}
        onRenameChat={renameConversation}
        onPinChat={pinConversation}
        activeDocument={activeFilename}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenCommandPalette={() => setCmdPaletteOpen(true)}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        isMobile={isMobile}
      />

      {/* ── Main region ── */}
      <div
        className="main-region"
        style={{ marginLeft: !isMobile && sidebarOpen ? 'var(--sidebar-w)' : 0 }}
      >
        {/* Context bar / Header */}
        <Header
          onToggleSidebar={() => setSidebarOpen(v => !v)}
          sidebarOpen={sidebarOpen}
          activeDocument={activeFilename}
          onNewChat={handleNewChat}
          onClearChat={handleClearChat}
          onDownloadChat={handleDownloadChat}
          hasMessages={messages.length > 0}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {/* Content panes */}
        <div className="content-panes" style={{ position: 'relative' }}>
          {/* ── Document Panel (only when chat is active) ── */}
          {showChat && !isMobile && (
            <DocumentPanel
              activeDoc={activeDoc}
              onReplace={handleReset}
              hoveredCitationId={hoveredCitationId}
            />
          )}

          {/* ── Main content ── */}
          {!showChat ? (
            <WelcomeScreen
              onFileSelect={handleFileSelect}
              onSuggestedPrompt={prompt => {
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
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
              <ChatArea
                messages={messages}
                isChatLoading={isChatLoading}
                streamingMessageId={streamingMessageId}
                activeFilename={activeFilename}
                uploadChunks={activeDoc?.chunks}
                uploadedAt={activeDoc?.uploadedAt}
                onSuggestedPrompt={handleChatSubmit}
                onRegenerate={handleRegenerate}
                onReplace={handleReset}
                onCitationHover={handleCitationHover}
              />
              <ChatInput
                value={inputValue}
                onChange={setInputValue}
                onSubmit={handleChatSubmit}
                disabled={isChatLoading}
                placeholder={`Ask about "${activeFilename}"…`}
                onAttach={handleFileSelect}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Overlays ── */}
      <CommandPalette
        isOpen={cmdPaletteOpen}
        onClose={() => setCmdPaletteOpen(false)}
        conversations={conversations}
        onSwitchChat={id => { switchConversation(id); setCmdPaletteOpen(false); }}
        onNewChat={() => { handleNewChat(); setCmdPaletteOpen(false); }}
        onDownloadChat={handleDownloadChat}
        hasMessages={messages.length > 0}
        onDeleteChat={deleteConversation}
      />

      <KeyboardShortcuts
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </div>
  );
}
