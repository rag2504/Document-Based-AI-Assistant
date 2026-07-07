import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Network, Hash, Database, Trash2, AlertTriangle, X } from 'lucide-react';
import InteractiveGraph from './InteractiveGraph';
import DocumentReader from './DocumentReader';

export default function DocumentPanel({ activeDoc, onReplace, hoveredCitationId }) {
  const [viewMode, setViewMode] = useState('reader'); // 'reader' | 'graph'
  const [showConfirm, setShowConfirm] = useState(false);

  if (!activeDoc) return null;

  const { filename, chunks } = activeDoc;

  const handleRemoveClick = () => setShowConfirm(true);
  const handleCancel = () => setShowConfirm(false);
  const handleConfirm = () => {
    setShowConfirm(false);
    onReplace();
  };

  return (
    <>
      <aside
        className="doc-panel"
        aria-label="Document workspace explorer"
      >
        {/* ── Document identity header ── */}
        <div style={{
          padding: 'var(--sp-3) var(--sp-4)',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <div style={{
            fontSize: 'var(--text-2xs)', fontWeight: 700,
            color: 'var(--accent)', textTransform: 'uppercase',
            letterSpacing: '0.08em', marginBottom: 4,
          }}>
            Active Entity
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
            <FileText size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <span
              className="truncate"
              style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}
              title={filename}
            >
              {filename}
            </span>

            {/* ── Remove Document button — visible trash icon in header ── */}
            <button
              onClick={handleRemoveClick}
              title="Remove Document"
              style={{
                flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 28, height: 28,
                borderRadius: 'var(--r-md)',
                border: '1px solid var(--border-med)',
                background: 'transparent',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.12)';
                e.currentTarget.style.color = '#ef4444';
                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.borderColor = 'var(--border-med)';
              }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* ── View mode selector — 16px horizontal padding, 8px vertical, 32px height ── */}
        <div style={{
          padding: 'var(--sp-2) var(--sp-4)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          gap: 'var(--sp-2)',
          flexShrink: 0,
        }}>
          {[
            { id: 'reader', label: 'Reader', Icon: FileText },
            { id: 'graph',  label: 'Mind Map', Icon: Network },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setViewMode(id)}
              style={{
                flex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                height: 32,
                paddingInline: 'var(--sp-3)',
                borderRadius: 'var(--r-md)',
                fontSize: 'var(--text-xs)', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'var(--font-sans)', border: 'none',
                background: viewMode === id ? 'var(--surface-raised)' : 'transparent',
                color: viewMode === id ? 'var(--accent)' : 'var(--text-muted)',
                boxShadow: viewMode === id ? 'var(--s-1)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={12} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* ── Main viewport ── */}
        <div style={{
          flex: 1, overflow: 'hidden',
          padding: 'var(--sp-4)',
          display: 'flex', flexDirection: 'column',
        }}>
          <AnimatePresence mode="wait">
            {viewMode === 'reader' ? (
              <motion.div
                key="reader-view"
                style={{ flex: 1, minHeight: 0 }}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              >
                <DocumentReader
                  filename={filename}
                  hoveredCitationId={hoveredCitationId}
                />
              </motion.div>
            ) : (
              <motion.div
                key="graph-view"
                style={{ flex: 1, minHeight: 0 }}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              >
                <InteractiveGraph
                  filename={filename}
                  chunksCount={chunks}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Metadata footer — 16px horizontal · 12px vertical ── */}
        <div style={{
          padding: 'var(--sp-3) var(--sp-4)',
          borderTop: '1px solid var(--border)',
          background: 'var(--surface-2)',
          display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)',
          flexShrink: 0,
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontSize: 'var(--text-2xs)',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
              <Hash size={10} /> Chunks
            </span>
            <span style={{ fontWeight: 650, color: 'var(--text-secondary)' }}>{chunks ?? '—'}</span>
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontSize: 'var(--text-2xs)',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
              <Database size={10} /> Model
            </span>
            <span style={{ fontWeight: 650, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              MiniLM-L6
            </span>
          </div>

          {/* ── Remove Document — prominent red button ── */}
          <button
            onClick={handleRemoveClick}
            style={{
              marginTop: 'var(--sp-1)',
              width: '100%',
              height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              border: '1px solid rgba(239,68,68,0.35)',
              borderRadius: 'var(--r-md)',
              background: 'rgba(239,68,68,0.07)',
              color: '#ef4444',
              fontSize: 'var(--text-xs)', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'var(--font-sans)',
              transition: 'all 0.18s ease',
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.18)';
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.6)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.07)';
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.35)';
            }}
          >
            <Trash2 size={12} />
            Remove Document
          </button>
        </div>
      </aside>

      {/* ── Confirmation Modal ── */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            key="confirm-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(6px)',
              zIndex: 9999,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onClick={handleCancel}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: 'spring', stiffness: 380, damping: 26 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--error-subtle)',
                borderRadius: 'var(--r-xl)',
                padding: '24px',
                width: 360,
                boxShadow: 'var(--s-4)',
                display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 'var(--r-lg)',
                    background: 'var(--error-subtle)',
                    border: '1px solid rgba(220,38,38,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <AlertTriangle size={20} color="var(--error)" />
                  </div>
                  <div>
                    <div style={{
                      fontSize: 'var(--text-sm)', fontWeight: 700,
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-sans)',
                    }}>
                      Remove Document?
                    </div>
                    <div style={{
                      fontSize: 'var(--text-xs)', color: 'var(--text-muted)',
                      marginTop: 3, fontFamily: 'var(--font-sans)',
                    }}>
                      This action cannot be undone
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleCancel}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-med)',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: 5, borderRadius: 'var(--r-md)',
                    display: 'flex', alignItems: 'center',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: 'var(--border)', marginInline: -4 }} />

              {/* File name chip */}
              <div style={{
                background: 'var(--error-subtle)',
                border: '1px solid rgba(220,38,38,0.18)',
                borderRadius: 'var(--r-md)',
                padding: '10px 14px',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <Trash2 size={13} color="var(--error)" style={{ flexShrink: 0 }} />
                <span style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-mono)',
                  wordBreak: 'break-all',
                  lineHeight: 1.5,
                }}>
                  {filename}
                </span>
              </div>

              {/* Description */}
              <p style={{
                fontSize: 'var(--text-sm)', color: 'var(--text-secondary)',
                lineHeight: 'var(--leading-snug)',
                fontFamily: 'var(--font-sans)', margin: 0,
              }}>
                Are you sure you want to remove this file? All indexed chunks and embeddings will be cleared from the knowledge base.
              </p>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-1)' }}>
                <button
                  onClick={handleCancel}
                  style={{
                    flex: 1, height: 38,
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border-med)',
                    borderRadius: 'var(--r-md)',
                    color: 'var(--text-primary)',
                    fontSize: 'var(--text-sm)', fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'var(--font-sans)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.borderColor = 'var(--border-med)'; }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  style={{
                    flex: 1, height: 38,
                    background: 'var(--error)',
                    border: '1px solid var(--error)',
                    borderRadius: 'var(--r-md)',
                    color: '#fff',
                    fontSize: 'var(--text-sm)', fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'var(--font-sans)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    transition: 'all 0.15s ease',
                    boxShadow: '0 2px 8px rgba(220,38,38,0.3)',
                  }}
                  onMouseOver={e => { e.currentTarget.style.opacity = '0.88'; }}
                  onMouseOut={e => { e.currentTarget.style.opacity = '1'; }}
                >
                  <Trash2 size={14} />
                  Yes, Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
