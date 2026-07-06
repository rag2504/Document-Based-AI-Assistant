import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';

const SHORTCUTS = [
  { keys: ['⌘', 'K'], desc: 'Open command palette' },
  { keys: ['?'], desc: 'Show keyboard shortcuts' },
  { keys: ['N'], desc: 'New chat' },
  { keys: ['Enter'], desc: 'Send message' },
  { keys: ['Shift', 'Enter'], desc: 'Newline in input' },
  { keys: ['Esc'], desc: 'Close modal / cancel' },
  { keys: ['↑', '↓'], desc: 'Navigate command palette' },
];

export default function KeyboardShortcuts({ isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-backdrop"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="modal-panel"
            onClick={e => e.stopPropagation()}
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Keyboard size={16} style={{ color: 'var(--accent)' }} />
                <span className="modal-title">Keyboard Shortcuts</span>
              </div>
              <button className="icon-btn" onClick={onClose} aria-label="Close">
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              {SHORTCUTS.map((s, i) => (
                <div key={i} className="shortcut-row">
                  <span className="shortcut-desc">{s.desc}</span>
                  <div className="shortcut-keys">
                    {s.keys.map((k, j) => (
                      <React.Fragment key={j}>
                        <span className="kbd">{k}</span>
                        {j < s.keys.length - 1 && (
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>+</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
