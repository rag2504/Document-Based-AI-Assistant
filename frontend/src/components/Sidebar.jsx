import React, { useState, useRef, useEffect } from 'react';
import {
  Plus, MessageSquare, Trash2, Pencil, Check, X,
  FileText, ChevronLeft, Layers, Settings, Moon, Sun,
  Clock
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
  activeDocument,
  theme,
  onToggleTheme,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const editRef = useRef(null);

  useEffect(() => {
    if (editingId && editRef.current) editRef.current.focus();
  }, [editingId]);

  const startRename = (e, conv) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const commitRename = (id) => {
    if (editTitle.trim()) onRenameChat(id, editTitle.trim());
    setEditingId(null);
  };

  const handleRenameKey = (e, id) => {
    if (e.key === 'Enter') commitRename(id);
    if (e.key === 'Escape') setEditingId(null);
  };

  const formatTime = (iso) => {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="sidebar-overlay md:hidden" onClick={onClose} />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`} style={{ width: '280px' }}>
        {/* ── Logo ── */}
        <div style={{
          padding: '20px 16px 16px',
          borderBottom: '1px solid var(--sidebar-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #2563EB, #8B5CF6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
              flexShrink: 0,
            }}>
              <Layers size={18} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                DocAI
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                RAG Assistant
              </div>
            </div>
          </div>

          {/* Collapse button (mobile) */}
          <button
            onClick={onClose}
            className="md:hidden btn btn-ghost"
            style={{ padding: '6px', borderRadius: '8px' }}
            aria-label="Close sidebar"
          >
            <ChevronLeft size={18} />
          </button>
        </div>

        {/* ── New Chat button ── */}
        <div style={{ padding: '14px 12px 10px' }}>
          <button
            onClick={onNewChat}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '10px 16px', borderRadius: '12px', fontSize: '13.5px' }}
          >
            <Plus size={16} />
            New Chat
          </button>
        </div>

        {/* ── Conversations list ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 12px' }}>
          {conversations.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '32px 16px',
              color: 'var(--text-muted)', fontSize: '13px',
            }}>
              <MessageSquare size={28} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
              <p>No conversations yet.</p>
              <p style={{ marginTop: '4px', fontSize: '12px' }}>Start a new chat above.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => { onSwitchChat(conv.id); onClose(); }}
                  className={`sidebar-item ${conv.id === activeId ? 'active' : ''}`}
                  style={{ position: 'relative', cursor: 'pointer', paddingRight: '8px' }}
                >
                  <MessageSquare size={15} style={{ flexShrink: 0, opacity: 0.7 }} />

                  {editingId === conv.id ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={(e) => e.stopPropagation()}>
                      <input
                        ref={editRef}
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => handleRenameKey(e, conv.id)}
                        style={{
                          flex: 1, border: '1px solid var(--primary)',
                          borderRadius: '6px', padding: '2px 6px',
                          fontSize: '13px', background: 'var(--surface)',
                          color: 'var(--text-primary)', outline: 'none',
                        }}
                      />
                      <button onClick={() => commitRename(conv.id)}
                        style={{ color: 'var(--primary)', padding: '2px', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <Check size={14} />
                      </button>
                      <button onClick={() => setEditingId(null)}
                        style={{ color: 'var(--text-muted)', padding: '2px', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '13.5px', fontWeight: 500,
                          color: conv.id === activeId ? 'var(--primary)' : 'var(--text-primary)',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {conv.title}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <Clock size={10} style={{ color: 'var(--text-muted)' }} />
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {formatTime(conv.createdAt)}
                          </span>
                          {conv.documentName && (
                            <span style={{
                              fontSize: '10.5px', color: 'var(--text-muted)',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              maxWidth: '80px',
                            }}>
                              · {conv.documentName}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action icons (visible on hover) */}
                      <div
                        className="conv-actions"
                        style={{ display: 'flex', gap: '2px', opacity: 0, transition: 'opacity 0.15s' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button onClick={(e) => startRename(e, conv)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--text-muted)', padding: '4px', borderRadius: '5px',
                          }}
                          onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                          onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                          title="Rename"
                        >
                          <Pencil size={13} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onDeleteChat(conv.id); }}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--text-muted)', padding: '4px', borderRadius: '5px',
                          }}
                          onMouseOver={(e) => e.currentTarget.style.color = '#EF4444'}
                          onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Active document chip ── */}
        {activeDocument && (
          <div style={{ padding: '8px 12px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 12px', borderRadius: '10px',
              background: 'var(--sidebar-active)',
              border: '1px solid rgba(37,99,235,0.15)',
            }}>
              <FileText size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--primary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Active Document
                </div>
                <div style={{
                  fontSize: '12.5px', fontWeight: 500, color: 'var(--text-primary)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {activeDocument}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Bottom actions ── */}
        <div style={{
          padding: '12px', borderTop: '1px solid var(--sidebar-border)',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <button
            onClick={onToggleTheme}
            className="btn btn-ghost"
            style={{ flex: 1, justifyContent: 'center', gap: '8px', padding: '9px' }}
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            <span style={{ fontSize: '13px' }}>{theme === 'dark' ? 'Light' : 'Dark'} mode</span>
          </button>
        </div>
      </aside>

      {/* Inline style to show conv-actions on hover */}
      <style>{`
        .sidebar-item:hover .conv-actions { opacity: 1 !important; }
      `}</style>
    </>
  );
}
