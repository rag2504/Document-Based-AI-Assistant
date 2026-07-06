import { useState, useCallback, useEffect } from 'react';

const ACTIVE_KEY = 'docai_active_conversation';

function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 10);
}

export function useConversations(initialConversations = []) {
  const [conversations, setConversations] = useState(initialConversations);
  const [activeId, setActiveId] = useState(() => {
    try {
      return localStorage.getItem(ACTIVE_KEY) || null;
    } catch {
      return null;
    }
  });

  // Persist active ID
  useEffect(() => {
    try {
      if (activeId) {
        localStorage.setItem(ACTIVE_KEY, activeId);
      } else {
        localStorage.removeItem(ACTIVE_KEY);
      }
    } catch { /* ignore */ }
  }, [activeId]);

  // Derive active conversation
  const activeConversation = conversations.find((c) => c.id === activeId) || null;

  // Set initial data from server
  const setServerData = useCallback((serverConversations) => {
    setConversations(serverConversations);
    
    // Check if the saved active ID exists in the fetched list
    const isValid = serverConversations.some((c) => c.id === activeId);
    
    if (serverConversations.length > 0) {
      if (!activeId || !isValid) {
        // Fallback to the most recent conversation
        setActiveId(serverConversations[0].id);
      }
    } else {
      setActiveId(null);
    }
  }, [activeId]);

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
        const title =
          conv.title === 'New Chat' && message.role === 'user'
            ? (message.content.trim().slice(0, 50) + (message.content.trim().length > 50 ? '…' : ''))
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

  // Toggle pin for a conversation
  const pinConversation = useCallback((id) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c))
    );
  }, []);

  return {
    conversations,
    activeConversation,
    activeId,
    setServerData,
    createNewChat,
    addMessage,
    updateLastAssistantMessage,
    clearMessages,
    deleteConversation,
    renameConversation,
    switchConversation,
    setDocumentName,
    setActiveId,
    pinConversation,
  };
}
