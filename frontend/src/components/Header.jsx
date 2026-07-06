import React from 'react';
import {
  Menu, FileText, Plus, Trash2, Download, Moon, Sun, X
} from 'lucide-react';

export default function Header({
  onToggleSidebar,
  activeDocument,
  onNewChat,
  onClearChat,
  onDownloadChat,
  hasMessages,
  theme,
  onToggleTheme,
}) {
  return (
    <header className="header">
      {/* Hamburger */}
      <button
        onClick={onToggleSidebar}
        className="btn btn-ghost"
        style={{ padding: '7px', borderRadius: '9px', flexShrink: 0 }}
        aria-label="Toggle sidebar"
      >
        <Menu size={18} />
      </button>

      {/* Logo / brand (mobile) */}
      <div style={{
        fontSize: '15px', fontWeight: 700,
        background: 'linear-gradient(135deg, #2563EB, #8B5CF6)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        display: 'none',
      }} className="mobile-brand">
        DocAI
      </div>

      {/* Active document badge */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        {activeDocument ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '6px 14px', borderRadius: '99px',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            maxWidth: '400px',
          }}>
            <div style={{
              width: '7px', height: '7px', borderRadius: '50%',
              background: '#10B981', flexShrink: 0,
              boxShadow: '0 0 0 2px rgba(16,185,129,0.2)',
            }} />
            <FileText size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <span style={{
              fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              maxWidth: '280px',
            }}>
              {activeDocument}
            </span>
          </div>
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '5px 12px', borderRadius: '99px',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
          }}>
            <div style={{
              width: '7px', height: '7px', borderRadius: '50%',
              background: 'var(--text-muted)',
            }} />
            <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 500 }}>
              No document loaded
            </span>
          </div>
        )}
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className="btn btn-ghost"
          style={{ padding: '7px', borderRadius: '9px' }}
          title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Download chat */}
        {hasMessages && (
          <button
            onClick={onDownloadChat}
            className="btn btn-ghost"
            style={{ padding: '7px', borderRadius: '9px' }}
            title="Download chat as Markdown"
          >
            <Download size={16} />
          </button>
        )}

        {/* Clear chat */}
        {hasMessages && (
          <button
            onClick={onClearChat}
            className="btn btn-ghost"
            style={{ padding: '7px', borderRadius: '9px', color: '#EF4444' }}
            title="Clear chat"
          >
            <Trash2 size={16} />
          </button>
        )}

        {/* New chat */}
        <button
          onClick={onNewChat}
          className="btn btn-primary"
          style={{ padding: '7px 14px', borderRadius: '9px', fontSize: '13px' }}
        >
          <Plus size={15} />
          <span className="hide-sm">New Chat</span>
        </button>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .hide-sm { display: none; }
          .mobile-brand { display: block !important; }
        }
      `}</style>
    </header>
  );
}
