import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'docai_conversations';
const ACTIVE_KEY = 'docai_active_conversation';

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

function generateTitle(firstMessage) {
  if (!firstMessage) return 'New Chat';
  const truncated = firstMessage.trim().slice(0, 50);
  return truncated.length < firstMessage.trim().length ? truncated + '…' : truncated;
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(conversations) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch { /* ignore */ }
}

export function useConversations() {
  const [conversations, setConversations] = useState(() => loadFromStorage());
  const [activeId, setActiveId] = useState(() => {
    try { return localStorage.getItem(ACTIVE_KEY) || null; } catch { return null; }
  });

  // Persist conversations whenever they change
  useEffect(() => {
    saveToStorage(conversations);
  }, [conversations]);

  // Persist active ID
  useEffect(() => {
    try {
      if (activeId) localStorage.setItem(ACTIVE_KEY, activeId);
      else localStorage.removeItem(ACTIVE_KEY);
    } catch { /* ignore */ }
  }, [activeId]);

  // Derive active conversation
  const activeConversation = conversations.find((c) => c.id === activeId) || null;

  // Create a new empty conversation
  const createNewChat = useCallback((documentName = null) => {
    const id = generateId();
    const newConv = {
      id,
      title: 'New Chat',
      documentName,
      createdAt: new Date().toISOString(),
      messages: [],
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveId(id);
    return id;
  }, []);

  // Add or update a message in the active conversation
  const addMessage = useCallback((message) => {
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id !== activeId) return conv;
        const newMessages = [...conv.messages, message];
        // Auto-set title from first user message
        const title =
          conv.title === 'New Chat' && message.role === 'user'
            ? generateTitle(message.content)
            : conv.title;
        return { ...conv, messages: newMessages, title };
      })
    );
  }, [activeId]);

  // Update (stream) last assistant message
  const updateLastAssistantMessage = useCallback((updater) => {
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id !== activeId) return conv;
        const messages = [...conv.messages];
        const lastIdx = messages.length - 1;
        if (lastIdx >= 0 && messages[lastIdx].role === 'assistant') {
          messages[lastIdx] = typeof updater === 'function'
            ? updater(messages[lastIdx])
            : { ...messages[lastIdx], ...updater };
        }
        return { ...conv, messages };
      })
    );
  }, [activeId]);

  // Clear all messages in active conversation
  const clearMessages = useCallback(() => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === activeId ? { ...conv, messages: [] } : conv
      )
    );
  }, [activeId]);

  // Delete a conversation
  const deleteConversation = useCallback((id) => {
    setConversations((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      if (activeId === id) {
        const newActive = filtered.length > 0 ? filtered[0].id : null;
        setActiveId(newActive);
      }
      return filtered;
    });
  }, [activeId]);

  // Rename a conversation
  const renameConversation = useCallback((id, newTitle) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
    );
  }, []);

  // Switch to a different conversation
  const switchConversation = useCallback((id) => {
    setActiveId(id);
  }, []);

  // Update document name for active conversation
  const setDocumentName = useCallback((documentName) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === activeId ? { ...c, documentName } : c))
    );
  }, [activeId]);

  return {
    conversations,
    activeConversation,
    activeId,
    createNewChat,
    addMessage,
    updateLastAssistantMessage,
    clearMessages,
    deleteConversation,
    renameConversation,
    switchConversation,
    setDocumentName,
  };
}
