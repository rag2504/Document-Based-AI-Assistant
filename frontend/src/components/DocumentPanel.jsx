import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Network, Hash, Database } from 'lucide-react';
import InteractiveGraph from './InteractiveGraph';
import DocumentReader from './DocumentReader';

export default function DocumentPanel({ activeDoc, onReplace, hoveredCitationId }) {
  const [viewMode, setViewMode] = useState('reader'); // 'reader' | 'graph'

  if (!activeDoc) return null;

  const { filename, chunks } = activeDoc;

  return (
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
            style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}
            title={filename}
          >
            {filename}
          </span>
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

        {/* De-initialize — full-width, 32px height */}
        <button
          onClick={onReplace}
          style={{
            marginTop: 'var(--sp-1)',
            width: '100%',
            height: 32,
            border: '1px solid var(--border-med)',
            borderRadius: 'var(--r-md)',
            background: 'transparent',
            color: 'var(--text-muted)',
            fontSize: 'var(--text-xs)', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'var(--font-sans)',
            transition: 'all 0.15s ease',
          }}
          onMouseOver={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
          onMouseOut={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-med)'; }}
        >
          De-initialize Asset
        </button>
      </div>
    </aside>
  );
}
