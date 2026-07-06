import React from 'react';
import { FileText, CheckCircle2, Database, Layers, Clock, RefreshCw, Hash } from 'lucide-react';

function formatBytes(bytes) {
  if (!bytes) return 'Unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatTime(iso) {
  if (!iso) return 'Just now';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function UploadCard({ filename, chunks, fileSize, uploadedAt, onReplace }) {
  const ext = filename?.split('.').pop()?.toUpperCase() || 'DOC';
  const isSuccess = !!filename;

  return (
    <div className="doc-card" style={{ maxWidth: '560px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '16px' }}>
        {/* File icon */}
        <div style={{
          width: '48px', height: '56px', borderRadius: '10px',
          background: ext === 'PDF'
            ? 'linear-gradient(135deg, #EF4444, #DC2626)'
            : 'linear-gradient(135deg, #3B82F6, #2563EB)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'flex-end', paddingBottom: '7px',
          flexShrink: 0, position: 'relative', overflow: 'hidden',
          boxShadow: ext === 'PDF'
            ? '0 4px 12px rgba(239,68,68,0.3)'
            : '0 4px 12px rgba(37,99,235,0.3)',
        }}>
          {/* Dog-ear */}
          <div style={{
            position: 'absolute', top: 0, right: 0,
            width: '14px', height: '14px',
            background: 'rgba(255,255,255,0.25)',
            borderBottomLeftRadius: '6px',
          }} />
          <FileText size={18} color="white" style={{ marginBottom: '2px' }} />
          <span style={{ fontSize: '9px', fontWeight: 800, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.05em' }}>
            {ext}
          </span>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            marginBottom: '4px',
          }}>
            {filename}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span className="badge badge-green">
              <CheckCircle2 size={10} />
              Indexed
            </span>
            <span className="badge badge-blue">
              <Database size={10} />
              ChromaDB
            </span>
            <span className="badge badge-purple">
              <Layers size={10} />
              RAG Ready
            </span>
          </div>
        </div>

        {/* Replace button */}
        <button
          onClick={onReplace}
          className="btn btn-ghost"
          style={{ padding: '6px 10px', fontSize: '12px', flexShrink: 0 }}
          title="Replace document"
        >
          <RefreshCw size={13} />
          Replace
        </button>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'var(--border)', marginBottom: '14px' }} />

      {/* Metadata grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
        gap: '10px',
      }}>
        {[
          { icon: <Hash size={13} />, label: 'Chunks', value: chunks ?? '—' },
          { icon: <Database size={13} />, label: 'Vector DB', value: 'ChromaDB' },
          { icon: <Layers size={13} />, label: 'Embeddings', value: 'Sentence-T' },
          { icon: <Clock size={13} />, label: 'Uploaded', value: formatTime(uploadedAt) },
        ].map(({ icon, label, value }) => (
          <div key={label} style={{
            padding: '10px 12px', borderRadius: '10px',
            background: 'var(--surface-2)', border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              {icon}
              <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {label}
              </span>
            </div>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
