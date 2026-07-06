import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MessageSquare, FileText, Plus, Download, Trash2, ArrowRight, Command } from 'lucide-react';

export default function CommandPalette({ isOpen, onClose, conversations, onSwitchChat, onNewChat, onDownloadChat, hasMessages, onDeleteChat }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const staticActions = [
    { type: 'action', icon: <Plus size={14} />, title: 'New Chat', sub: 'Start a new conversation', kbd: 'N', action: () => { onNewChat(); onClose(); } },
    ...(hasMessages ? [
      { type: 'action', icon: <Download size={14} />, title: 'Export Chat', sub: 'Download chat as Markdown', action: () => { onDownloadChat(); onClose(); } },
    ] : []),
  ];

  const filteredConvs = query.trim()
    ? conversations.filter(c => c.title.toLowerCase().includes(query.toLowerCase()))
    : conversations.slice(0, 6);

  const allItems = [
    ...staticActions,
    ...filteredConvs.map(c => ({
      type: 'conv',
      icon: <MessageSquare size={14} />,
      title: c.title,
      sub: c.documentName ? `Document: ${c.documentName}` : 'Conversation',
      id: c.id,
      action: () => { onSwitchChat(c.id); onClose(); },
    })),
  ];

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, allItems.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter') { e.preventDefault(); allItems[selected]?.action?.(); }
  }, [allItems, selected]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="cmd-backdrop"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="cmd-panel"
            onClick={e => e.stopPropagation()}
            initial={{ scale: 0.94, opacity: 0, y: -12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: -12 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            {/* Search input */}
            <div className="cmd-input-row">
              <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                ref={inputRef}
                className="cmd-input"
                value={query}
                onChange={e => { setQuery(e.target.value); setSelected(0); }}
                onKeyDown={handleKeyDown}
                placeholder="Search conversations, actions…"
                aria-label="Command palette search"
              />
              <span className="cmd-esc-hint">ESC</span>
            </div>

            {/* Results */}
            <div className="cmd-results" role="listbox">
              {allItems.length === 0 ? (
                <div className="cmd-empty">No results found</div>
              ) : (
                <>
                  {staticActions.length > 0 && (
                    <div className="cmd-section-label">Actions</div>
                  )}
                  {allItems.map((item, i) => {
                    const isConvSection = item.type === 'conv' && (i === 0 || allItems[i - 1]?.type !== 'conv');
                    return (
                      <React.Fragment key={i}>
                        {isConvSection && (
                          <div className="cmd-section-label">
                            {query.trim() ? 'Conversations' : 'Recent conversations'}
                          </div>
                        )}
                        <div
                          className={`cmd-item ${selected === i ? 'selected' : ''}`}
                          role="option"
                          aria-selected={selected === i}
                          onClick={item.action}
                          onMouseEnter={() => setSelected(i)}
                        >
                          <div className="cmd-item-icon">{item.icon}</div>
                          <div className="cmd-item-text">
                            <div className="cmd-item-title">{item.title}</div>
                            {item.sub && <div className="cmd-item-sub">{item.sub}</div>}
                          </div>
                          {item.kbd && <span className="cmd-item-kbd">{item.kbd}</span>}
                          {selected === i && <ArrowRight size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
                        </div>
                      </React.Fragment>
                    );
                  })}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="cmd-footer">
              <div className="cmd-footer-hint">
                <span className="cmd-item-kbd">↑↓</span>
                <span>Navigate</span>
              </div>
              <div className="cmd-footer-hint">
                <span className="cmd-item-kbd">↵</span>
                <span>Select</span>
              </div>
              <div className="cmd-footer-hint">
                <span className="cmd-item-kbd">ESC</span>
                <span>Close</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
