import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, MessageSquare, Trash2, Pencil, Check, X,
  FileText, ChevronLeft, Settings, Moon, Sun,
  Search, Pin, PinOff, Keyboard, Zap
} from 'lucide-react';

export default function Sidebar({
  isOpen,
  onClose,
  conversations,
  activeId,
  onNewChat,
  onSwitchChat,
  onDeleteChat,
  onRenameChat,
  onPinChat,
  activeDocument,
  theme,
  onToggleTheme,
  onOpenCommandPalette,
  onOpenShortcuts,
  isMobile,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const editRef = useRef(null);

  useEffect(() => {
    if (editingId && editRef.current) editRef.current.focus();
  }, [editingId]);

  const startRename = useCallback((e, conv) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  }, []);

  const commitRename = useCallback((id) => {
    if (editTitle.trim()) onRenameChat(id, editTitle.trim());
    setEditingId(null);
  }, [editTitle, onRenameChat]);

  const handleRenameKey = useCallback((e, id) => {
    if (e.key === 'Enter') commitRename(id);
    if (e.key === 'Escape') setEditingId(null);
  }, [commitRename]);

  const formatTime = (iso) => {
    try {
      const date = new Date(iso);
      const now = new Date();
      const diffMs = now - date;
      const diffDays = Math.floor(diffMs / 86400000);
      if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch { return ''; }
  };

  const filtered = searchQuery.trim()
    ? conversations.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : conversations;

  const pinned = filtered.filter(c => c.pinned);

  const now = new Date();
  const sod = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const soy = sod - 86400000;
  const so7 = sod - 6 * 86400000;

  const unpinned = filtered.filter(c => !c.pinned);
  const today     = unpinned.filter(c => new Date(c.createdAt).getTime() >= sod);
  const yesterday = unpinned.filter(c => { const t = new Date(c.createdAt).getTime(); return t >= soy && t < sod; });
  const last7     = unpinned.filter(c => { const t = new Date(c.createdAt).getTime(); return t >= so7 && t < soy; });
  const older     = unpinned.filter(c => new Date(c.createdAt).getTime() < so7);

  const groups = [
    { label: 'Pinned', items: pinned },
    { label: 'Today', items: today },
    { label: 'Yesterday', items: yesterday },
    { label: 'Previous 7 Days', items: last7 },
    { label: 'Older', items: older },
  ].filter(g => g.items.length > 0);

  const sidebarVariants = {
    open:   { x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    closed: { x: '-100%', transition: { type: 'spring', stiffness: 400, damping: 40 } },
  };

  const sidebarClasses = [
    'sidebar',
    isMobile && isOpen ? 'mobile-open' : '',
    !isMobile && !isOpen ? 'collapsed' : '',
  ].filter(Boolean).join(' ');

  const ConvItem = ({ conv }) => {
    const isActive = conv.id === activeId;
    const isEditing = editingId === conv.id;

    return (
      <div
        className={`sidebar-item ${isActive ? 'active' : ''}`}
        onClick={() => { if (!isEditing) { onSwitchChat(conv.id); if (isMobile) onClose(); } }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && !isEditing && onSwitchChat(conv.id)}
        aria-current={isActive ? 'page' : undefined}
      >
        {isEditing ? (
          <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: 4 }} onClick={e => e.stopPropagation()}>
            <input
              ref={editRef}
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onKeyDown={e => handleRenameKey(e, conv.id)}
              onBlur={() => commitRename(conv.id)}
              className="sidebar-rename-input"
            />
            <button className="sidebar-icon-btn" onClick={() => commitRename(conv.id)} title="Save">
              <Check size={12} />
            </button>
            <button className="sidebar-icon-btn" onClick={() => setEditingId(null)} title="Cancel">
              <X size={12} />
            </button>
          </div>
        ) : (
          <>
            <MessageSquare size={13} style={{ flexShrink: 0, color: isActive ? 'var(--accent)' : 'var(--text-muted)', marginRight: 2 }} />
            <span className="sidebar-item-text">{conv.title}</span>
            <span className="sidebar-item-time">{formatTime(conv.createdAt)}</span>
            <div className="sidebar-item-actions" onClick={e => e.stopPropagation()}>
              {onPinChat && (
                <button
                  className="sidebar-icon-btn"
                  onClick={() => onPinChat(conv.id)}
                  title={conv.pinned ? 'Unpin' : 'Pin'}
                >
                  {conv.pinned ? <PinOff size={12} /> : <Pin size={12} />}
                </button>
              )}
              <button className="sidebar-icon-btn" onClick={e => startRename(e, conv)} title="Rename">
                <Pencil size={12} />
              </button>
              <button className="sidebar-icon-btn danger" onClick={() => onDeleteChat(conv.id)} title="Delete">
                <Trash2 size={12} />
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            className="sidebar-overlay"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>

      <aside className={sidebarClasses} aria-label="Navigation sidebar">
        {/* ── Header ── */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-logo">
              <Zap size={14} />
            </div>
            <span className="sidebar-brand-text">Omnidoc</span>
          </div>
          <button
            className="sidebar-icon-btn"
            onClick={onClose}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <ChevronLeft size={16} />
          </button>
        </div>

        {/* ── Search / Command ── */}
        <div className="sidebar-search">
          <button
            className="sidebar-search-input"
            onClick={onOpenCommandPalette}
            aria-label="Open command palette"
          >
            <Search size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <span>Search or jump to…</span>
            <span className="sidebar-search-kbd">⌘K</span>
          </button>
        </div>

        {/* ── Inline search filter ── */}
        <div style={{ padding: '0 var(--sp-3) var(--sp-1)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
            padding: '0 var(--sp-3)', borderRadius: 'var(--r-md)',
            border: '1px solid var(--border)', background: 'var(--bg)',
            height: 32,
          }}>
            <Search size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter chats…"
              style={{
                flex: 1, border: 'none', background: 'transparent',
                fontSize: 'var(--text-sm)', color: 'var(--text-primary)',
                fontFamily: 'var(--font-sans)', outline: 'none',
              }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* ── New Chat ── */}
        <button className="sidebar-new-btn" onClick={() => { onNewChat(); if (isMobile) onClose(); }} aria-label="New chat">
          <Plus size={14} />
          New chat
        </button>

        {/* ── Active Document ── */}
        {activeDocument && (
          <div className="sidebar-doc-badge">
            <div className="sidebar-doc-dot" />
            <FileText size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 'var(--text-2xs)', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Active
              </div>
              <div className="truncate" style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-primary)' }}>
                {activeDocument}
              </div>
            </div>
          </div>
        )}

        {/* ── Conversations ── */}
        <div className="sidebar-scroll">
          {conversations.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--sp-8) var(--sp-4)' }}>
              <MessageSquare size={24} style={{ opacity: 0.3 }} />
              <div className="empty-state-title">No conversations yet</div>
              <div className="empty-state-desc">Start a new chat to begin exploring your documents.</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--sp-6) var(--sp-4)' }}>
              <Search size={20} style={{ opacity: 0.3 }} />
              <div className="empty-state-desc">No conversations match your search.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
              {groups.map(group => (
                <div key={group.label}>
                  <div className="sidebar-section-label">{group.label}</div>
                  {group.items.map(conv => <ConvItem key={conv.id} conv={conv} />)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="sidebar-footer">
          <button className="sidebar-footer-btn" onClick={onToggleTheme} title="Toggle theme">
            {theme === 'dark' ? <Sun size={14} style={{ color: 'var(--text-muted)' }} /> : <Moon size={14} style={{ color: 'var(--text-muted)' }} />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <button className="sidebar-footer-btn" onClick={onOpenShortcuts} title="Keyboard shortcuts">
            <Keyboard size={14} style={{ color: 'var(--text-muted)' }} />
            Keyboard shortcuts
            <span style={{ marginLeft: 'auto' }} className="hint-badge">?</span>
          </button>
        </div>
      </aside>
    </>
  );
}
