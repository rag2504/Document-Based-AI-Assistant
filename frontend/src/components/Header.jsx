import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Download, Moon, Sun } from 'lucide-react';

/* ── Animated Hamburger / X icon ── */
function HamburgerIcon({ isOpen }) {
  const line = {
    open:   { transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
    closed: { transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
  };

  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      style={{ display: 'block', overflow: 'visible' }}
    >
      {/* Top line → becomes top arm of X */}
      <motion.path
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
        initial={false}
        animate={{ d: isOpen ? "M 3 3 L 15 15" : "M 2 4.5 L 16 4.5" }}
        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      />
      {/* Middle line → fades out */}
      <motion.path
        d="M 2 9 L 16 9"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
        initial={false}
        animate={{ opacity: isOpen ? 0 : 1, pathLength: isOpen ? 0 : 1 }}
        style={{ transformOrigin: '50% 50%' }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      />
      {/* Bottom line → becomes bottom arm of X */}
      <motion.path
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
        initial={false}
        animate={{ d: isOpen ? "M 3 15 L 15 3" : "M 2 13.5 L 16 13.5" }}
        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      />
    </svg>
  );
}

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
    <header className="context-bar" role="banner" style={{ position: 'relative', zIndex: 50 }}>
      {/* ── Sidebar toggle with animated hamburger ── */}
      <motion.button
        className="icon-btn"
        onClick={onToggleSidebar}
        aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        style={{ color: 'var(--text-secondary)', position: 'relative', zIndex: 51 }}
        whileTap={{ scale: 0.88 }}
        transition={{ duration: 0.12 }}
      >
        <HamburgerIcon isOpen={sidebarOpen} />
      </motion.button>

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
      </div>

      <style>{`
        @media (max-width: 540px) { .hide-sm { display: none; } }
      `}</style>
    </header>
  );
}
