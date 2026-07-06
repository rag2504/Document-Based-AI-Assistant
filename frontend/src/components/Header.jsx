import React from 'react';
import { motion } from 'framer-motion';
import { Menu, FileText, Plus, Trash2, Download, Moon, Sun, AlignLeft } from 'lucide-react';

export default function Header({
  onToggleSidebar,
  activeDocument,
  onNewChat,
  onClearChat,
  onDownloadChat,
  hasMessages,
  theme,
  onToggleTheme,
  sidebarOpen,
}) {
  return (
    <header className="context-bar" role="banner">
      {/* ── Sidebar toggle ── */}
      <button
        className="icon-btn"
        onClick={onToggleSidebar}
        aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        style={{ color: 'var(--text-secondary)' }}
      >
        <Menu size={18} />
      </button>

      {/* ── Active document pill ── */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        {activeDocument ? (
          <motion.div
            className="context-bar-doc"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <div style={{
              width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
              background: 'var(--success)', boxShadow: '0 0 0 2px var(--success-subtle)',
            }} />
            <FileText size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <span className="context-bar-doc-name">{activeDocument}</span>
          </motion.div>
        ) : (
          <div className="context-bar-doc" style={{ opacity: 0.6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: 'var(--border-strong)' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>No document loaded</span>
          </div>
        )}
      </div>

      {/* ── Right actions ── */}
      <div className="context-bar-actions">
        <button
          className="icon-btn"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          aria-label="Toggle theme"
          style={{ color: 'var(--text-muted)' }}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {hasMessages && (
          <button
            className="icon-btn"
            onClick={onDownloadChat}
            title="Export chat as Markdown"
            aria-label="Download chat"
            style={{ color: 'var(--text-muted)' }}
          >
            <Download size={16} />
          </button>
        )}

        {hasMessages && (
          <button
            className="icon-btn"
            onClick={onClearChat}
            title="Clear chat"
            aria-label="Clear chat"
            style={{ color: 'var(--text-muted)' }}
          >
            <Trash2 size={16} />
          </button>
        )}

        <button
          className="btn btn-primary"
          onClick={onNewChat}
          aria-label="New chat"
          style={{ fontSize: 'var(--text-xs)', height: 32, padding: '0 12px' }}
        >
          <Plus size={14} />
          <span className="hide-sm">New chat</span>
        </button>
      </div>

      <style>{`
        @media (max-width: 540px) { .hide-sm { display: none; } }
      `}</style>
    </header>
  );
}
