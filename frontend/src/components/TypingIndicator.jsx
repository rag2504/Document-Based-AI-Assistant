import React from 'react';

export default function TypingIndicator() {
  return (
    <div className="animate-fade-slide-in" style={{
      display: 'flex', alignItems: 'flex-start', gap: '12px',
      paddingLeft: '4px',
    }}>
      {/* AI avatar */}
      <div style={{
        width: '32px', height: '32px', borderRadius: '10px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        boxShadow: 'var(--shadow-xs)',
      }}>
        <span style={{ fontSize: '16px' }}>✦</span>
      </div>

      {/* Dots */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        padding: '14px 18px',
        background: 'var(--ai-card)',
        border: '1px solid var(--ai-border)',
        borderRadius: '4px 18px 18px 18px',
        boxShadow: 'var(--shadow-xs)',
      }}>
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
      </div>
    </div>
  );
}
