import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, Hash, BookOpen } from 'lucide-react';

export default function SourcePanel({ sources }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(null);

  if (!sources || sources.length === 0) return null;

  const shortId = (id) => {
    if (!id) return '—';
    const parts = id.split('_');
    return parts.length > 1 ? `#${parts[parts.length - 1]}` : id.slice(-6);
  };

  return (
    <div style={{ marginTop: '14px' }}>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '6px 12px', borderRadius: '99px',
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          color: 'var(--text-secondary)',
          fontSize: '12.5px', fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'var(--surface-2)';
          e.currentTarget.style.borderColor = 'var(--primary)';
          e.currentTarget.style.color = 'var(--primary)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'var(--surface)';
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }}
      >
        <FileText size={13} />
        <span>{sources.length} source{sources.length !== 1 ? 's' : ''}</span>
        {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {/* Source cards */}
      {isOpen && (
        <div className="animate-fade-slide-in" style={{
          marginTop: '10px',
          display: 'flex', flexDirection: 'column', gap: '8px',
        }}>
          {sources.map((source, index) => {
            const isActive = activeIdx === index;
            return (
              <div
                key={source.chunk_id || index}
                className={`source-card ${isActive ? 'highlighted' : ''}`}
                onClick={() => setActiveIdx(isActive ? null : index)}
                style={{ cursor: 'pointer' }}
              >
                {/* Source header */}
                <div className="source-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '6px',
                      background: isActive ? 'var(--primary)' : 'var(--surface-3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background 0.2s',
                    }}>
                      <span style={{
                        fontSize: '11px', fontWeight: 700,
                        color: isActive ? 'white' : 'var(--text-secondary)',
                      }}>
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Source {index + 1}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {source.page != null && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <BookOpen size={12} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          Page {source.page}
                        </span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Hash size={11} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {shortId(source.chunk_id)}
                      </span>
                    </div>
                    {isActive ? (
                      <ChevronUp size={14} style={{ color: 'var(--text-muted)' }} />
                    ) : (
                      <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
                    )}
                  </div>
                </div>

                {/* Expanded snippet */}
                {isActive && source.text && (
                  <div className="animate-fade-in">
                    <p className="source-snippet">
                      "{source.text.length > 400 ? source.text.slice(0, 400) + '…' : source.text}"
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
