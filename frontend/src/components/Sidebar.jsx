import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, MessageSquare, Trash2, Pencil, Check, X,
  FileText, ChevronLeft, Settings, Moon, Sun,
  Search, Pin, PinOff, Keyboard, Zap, Lock, Upload
} from 'lucide-react';

/* ── Omnidoc Logo ── */
export const OmnidocLogo = ({ size = 28 }) => (
  <img
    src="/logo.svg"
    alt="Omnidoc logo"
    width={size}
    height={size}
    style={{ objectFit: 'contain', display: 'block', background: 'transparent', imageRendering: 'auto' }}
  />
);

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
  const [showUploadTip, setShowUploadTip] = useState(false);
  const editRef = useRef(null);
  const tipTimeoutRef = useRef(null);

  useEffect(() => {
    if (editingId && editRef.current) editRef.current.focus();
  }, [editingId]);

  // Clear tooltip timer on unmount
  useEffect(() => () => clearTimeout(tipTimeoutRef.current), []);

  const handleNewChat = () => {
    if (!activeDocument) {
      setShowUploadTip(true);
      clearTimeout(tipTimeoutRef.current);
      tipTimeoutRef.current = setTimeout(() => setShowUploadTip(false), 3000);
      return;
    }
    setShowUploadTip(false);
    onNewChat();
    if (isMobile) onClose();
  };

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
        <div className="sidebar-header" style={{ padding: 'var(--sp-2) var(--col-pad)', height: 'auto', minHeight: 'var(--header-h)' }}>
          <div className="sidebar-brand" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <OmnidocLogo size={36} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="sidebar-brand-text" style={{ fontSize: '20px', lineHeight: 1.1 }}>OMNIDOC</span>
              <span style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.02em', marginTop: '2px' }}>
                Document Intelligence Operating System
              </span>
            </div>
          </div>
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



        {/* ── New Chat ── */}
        <div style={{ position: 'relative', margin: '0 var(--sp-3) var(--sp-1)' }}>
          <button
            className="sidebar-new-btn"
            onClick={handleNewChat}
            aria-label="New chat"
            style={{
              width: '100%',
              margin: 0,
              opacity: activeDocument ? 1 : 0.55,
              cursor: activeDocument ? 'pointer' : 'not-allowed',
              borderStyle: activeDocument ? 'solid' : 'dashed',
            }}
          >
            {activeDocument ? <Plus size={14} /> : <Lock size={13} />}
            New chat
          </button>

          {/* ── Upload tooltip ── */}
          <AnimatePresence>
            {showUploadTip && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0, right: 0,
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--accent-light)',
                  borderRadius: 'var(--r-lg)',
                  padding: '10px 14px',
                  boxShadow: 'var(--s-3)',
                  zIndex: 60,
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                }}
              >
                {/* Arrow */}
                <div style={{
                  position: 'absolute', top: -5, left: 20,
                  width: 10, height: 10,
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--accent-light)',
                  borderBottom: 'none', borderRight: 'none',
                  transform: 'rotate(45deg)',
                }} />
                <div style={{
                  width: 30, height: 30, borderRadius: 'var(--r-md)',
                  background: 'var(--accent-subtle)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Upload size={14} color="var(--accent)" />
                </div>
                <div>
                  <div style={{
                    fontSize: 'var(--text-xs)', fontWeight: 700,
                    color: 'var(--text-primary)', marginBottom: 2,
                  }}>
                    Upload a PDF first
                  </div>
                  <div style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-muted)',
                    lineHeight: 1.45,
                  }}>
                    Drop or upload a document to start chatting.
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
