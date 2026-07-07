/**
 * Omnidoc — Central Zustand Store
 * Replaces scattered useState + hooks with a single source of truth.
 * Fixes all race conditions, stale closures, and sync bugs.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// ── helpers ──────────────────────────────────────────────────────────────────
function uid() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);
}

function readLS(key, fallback) {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}

function writeLS(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

function removeLS(key) {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}

// ── Session ID (stable across reloads) ───────────────────────────────────────
export function getSessionId() {
  let sid = localStorage.getItem('docai_session');
  if (!sid) {
    sid = uid();
    localStorage.setItem('docai_session', sid);
  }
  return sid;
}

// ─────────────────────────────────────────────────────────────────────────────
//  CONVERSATION STORE
// ─────────────────────────────────────────────────────────────────────────────
export const useConversationStore = create(
  subscribeWithSelector((set, get) => ({
    conversations: [],
    activeId: readLS('docai_active_conversation', null),

    // ── Non-reactive helpers (for use inside callbacks / outside React) ──
    getActive() {
      const { conversations, activeId } = get();
      return conversations.find((c) => c.id === activeId) || null;
    },

    getMessages() {
      return get().getActive()?.messages || [];
    },

    // ── Hydrate from server on mount ──
    setServerData(serverConversations) {
      const { activeId } = get();
      const isValid = serverConversations.some((c) => c.id === activeId);
      let newActiveId = activeId;

      if (serverConversations.length > 0 && (!activeId || !isValid)) {
        newActiveId = serverConversations[0].id;
      } else if (serverConversations.length === 0) {
        newActiveId = null;
      }

      set({ conversations: serverConversations, activeId: newActiveId });
      writeLS('docai_active_conversation', newActiveId);
    },

    // ── Create a fresh conversation and immediately switch to it ──
    createNewChat(documentName = null) {
      const id = uid();
      const newConv = {
        id,
        title: 'New Chat',
        documentName,
        createdAt: new Date().toISOString(),
        messages: [],
        pinned: false,
      };
      set((s) => ({ conversations: [newConv, ...s.conversations], activeId: id }));
      writeLS('docai_active_conversation', id);
      return id;
    },

    // ── Switch active conversation ──
    switchConversation(id) {
      set({ activeId: id });
      writeLS('docai_active_conversation', id);
    },

    // ── Add a message to a specific conversation id (avoids stale activeId) ──
    addMessage(convId, message) {
      set((s) => ({
        conversations: s.conversations.map((conv) => {
          if (conv.id !== convId) return conv;
          const newMessages = [...conv.messages, message];
          // Auto-title from first user message
          const title =
            conv.title === 'New Chat' && message.role === 'user'
              ? message.content.trim().slice(0, 50) + (message.content.trim().length > 50 ? '…' : '')
              : conv.title;
          return { ...conv, messages: newMessages, title };
        }),
      }));
    },

    // ── Stream-update the last assistant message in a specific conversation ──
    updateLastAssistant(convId, updater) {
      set((s) => ({
        conversations: s.conversations.map((conv) => {
          if (conv.id !== convId) return conv;
          const msgs = [...conv.messages];
          const lastIdx = msgs.length - 1;
          if (lastIdx >= 0 && msgs[lastIdx].role === 'assistant') {
            msgs[lastIdx] =
              typeof updater === 'function'
                ? updater(msgs[lastIdx])
                : { ...msgs[lastIdx], ...updater };
          }
          return { ...conv, messages: msgs };
        }),
      }));
    },

    // ── Delete a conversation; auto-switch to next available ──
    deleteConversation(id) {
      set((s) => {
        const filtered = s.conversations.filter((c) => c.id !== id);
        let newActiveId = s.activeId;
        if (s.activeId === id) {
          newActiveId = filtered.length > 0 ? filtered[0].id : null;
        }
        writeLS('docai_active_conversation', newActiveId);
        return { conversations: filtered, activeId: newActiveId };
      });
    },

    // ── Clear messages for active conversation ──
    clearMessages() {
      const { activeId } = get();
      if (!activeId) return;
      set((s) => ({
        conversations: s.conversations.map((c) =>
          c.id === activeId ? { ...c, messages: [], title: 'New Chat' } : c
        ),
      }));
    },

    // ── Rename ──
    renameConversation(id, newTitle) {
      set((s) => ({
        conversations: s.conversations.map((c) =>
          c.id === id ? { ...c, title: newTitle } : c
        ),
      }));
    },

    // ── Pin toggle ──
    pinConversation(id) {
      set((s) => ({
        conversations: s.conversations.map((c) =>
          c.id === id ? { ...c, pinned: !c.pinned } : c
        ),
      }));
    },

    // ── Set document name for active conversation ──
    setDocumentName(documentName) {
      const { activeId } = get();
      if (!activeId) return;
      set((s) => ({
        conversations: s.conversations.map((c) =>
          c.id === activeId ? { ...c, documentName } : c
        ),
      }));
    },
  }))
);

// ─────────────────────────────────────────────────────────────────────────────
//  CHAT UI STORE  (loading states, streaming, abort)
// ─────────────────────────────────────────────────────────────────────────────
export const useChatStore = create((set, get) => ({
  isLoading: false,
  loadingPhase: 'idle', // 'idle' | 'sending' | 'thinking' | 'searching' | 'generating'
  streamingMessageId: null,
  abortController: null,

  setLoading(isLoading, phase = 'idle') {
    set({ isLoading, loadingPhase: phase });
  },

  setStreamingId(id) {
    set({ streamingMessageId: id });
  },

  setAbortController(ctrl) {
    set({ abortController: ctrl });
  },

  abortCurrent() {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
      set({ abortController: null });
    }
  },

  reset() {
    set({
      isLoading: false,
      loadingPhase: 'idle',
      streamingMessageId: null,
      abortController: null,
    });
  },
}));

// ─────────────────────────────────────────────────────────────────────────────
//  DOCUMENT STORE
// ─────────────────────────────────────────────────────────────────────────────
function readStoredDoc() {
  try { return JSON.parse(localStorage.getItem('docai_active_doc') || 'null'); }
  catch { return null; }
}

export const useDocumentStore = create((set) => ({
  activeDoc: readStoredDoc(),
  uploadStatus: readStoredDoc() ? 'success' : 'idle', // 'idle'|'uploading'|'indexing'|'success'|'error'
  uploadProgress: 0,
  uploadError: null,

  setDoc(doc) {
    try { localStorage.setItem('docai_active_doc', JSON.stringify(doc)); } catch { /* */ }
    set({ activeDoc: doc, uploadStatus: doc ? 'success' : 'idle' });
  },

  setUploadStatus(status) { set({ uploadStatus: status }); },
  setUploadProgress(p) { set({ uploadProgress: p }); },
  setUploadError(err) { set({ uploadError: err }); },

  resetDoc() {
    try { localStorage.removeItem('docai_active_doc'); } catch { /* */ }
    set({ activeDoc: null, uploadStatus: 'idle', uploadProgress: 0, uploadError: null });
  },
}));

// ─────────────────────────────────────────────────────────────────────────────
//  UI STORE  (sidebar, theme, overlays)
// ─────────────────────────────────────────────────────────────────────────────
function isMobile() { return typeof window !== 'undefined' && window.innerWidth < 768; }
function getSidebarDefault() {
  try {
    const stored = localStorage.getItem('docai_sidebar_open');
    if (stored !== null) return stored === 'true';
  } catch { /* */ }
  return !isMobile();
}

export const useUIStore = create((set, get) => ({
  sidebarOpen: getSidebarDefault(),
  isMobile: isMobile(),
  theme: readLS('docai_theme', 'light'),
  cmdPaletteOpen: false,
  shortcutsOpen: false,
  hoveredCitationId: null,

  setSidebarOpen(v) {
    set({ sidebarOpen: v });
    try { localStorage.setItem('docai_sidebar_open', v); } catch { /* */ }
  },

  toggleSidebar() {
    const next = !get().sidebarOpen;
    set({ sidebarOpen: next });
    try { localStorage.setItem('docai_sidebar_open', next); } catch { /* */ }
  },

  setIsMobile(v) { set({ isMobile: v }); },

  setTheme(t) {
    set({ theme: t });
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('docai_theme', t); } catch { /* */ }
  },

  toggleTheme() {
    const next = get().theme === 'light' ? 'dark' : 'light';
    get().setTheme(next);
  },

  setCmdPaletteOpen(v) { set({ cmdPaletteOpen: v }); },
  setShortcutsOpen(v) { set({ shortcutsOpen: v }); },
  setHoveredCitationId(id) { set({ hoveredCitationId: id }); },
}));
