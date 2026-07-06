import React, { useRef, useEffect, useState } from 'react';
import { Send, Paperclip, CornerDownLeft } from 'lucide-react';

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder,
  onAttach,
}) {
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) onSubmit();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim() && !disabled) onSubmit();
  };

  const canSend = value.trim().length > 0 && !disabled;
  const charCount = value.length;
  const showCharCount = charCount > 400;

  return (
    <div className="chat-input-bar">
      <form onSubmit={handleSubmit}>
        <div className={`chat-input-wrapper ${disabled ? 'loading-state' : ''}`}>
          {/* Attachment button */}
          {onAttach && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt"
                style={{ display: 'none' }}
                onChange={(e) => { if (e.target.files?.[0]) onAttach(e.target.files[0]); }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                style={{
                  flexShrink: 0, background: 'none', border: 'none',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  color: 'var(--text-muted)', padding: '4px',
                  borderRadius: '7px', transition: 'color 0.15s',
                  display: 'flex', alignItems: 'center',
                }}
                onMouseOver={(e) => { if (!disabled) e.currentTarget.style.color = 'var(--primary)'; }}
                onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                title="Attach document"
              >
                <Paperclip size={17} />
              </button>
            </>
          )}

          {/* Text area */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? 'Generating response…' : (placeholder || 'Ask a question about the document…')}
            disabled={disabled}
            className="chat-textarea"
            aria-label="Chat input"
          />

          {/* Right side: char count + send */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            {showCharCount && (
              <span style={{
                fontSize: '11px', color: charCount > 900 ? '#EF4444' : 'var(--text-muted)',
                fontWeight: 500,
              }}>
                {charCount}
              </span>
            )}

            {/* Keyboard hint */}
            {!disabled && value.trim() && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '2px',
                fontSize: '10px', color: 'var(--text-muted)',
                border: '1px solid var(--border)', borderRadius: '5px',
                padding: '2px 5px',
              }} className="hide-mobile">
                <span>Enter</span>
                <CornerDownLeft size={10} />
              </div>
            )}

            {/* Send button */}
            <button
              type="submit"
              disabled={!canSend}
              className={`send-btn ${canSend ? 'btn-gradient' : ''}`}
              aria-label="Send message"
              title="Send (Enter)"
            >
              {disabled ? (
                <span style={{
                  width: '16px', height: '16px', borderRadius: '50%',
                  border: '2px solid var(--text-muted)',
                  borderTopColor: 'transparent',
                  animation: 'spin 0.7s linear infinite',
                  display: 'block',
                }} />
              ) : (
                <Send size={16} color={canSend ? 'white' : 'var(--text-muted)'} />
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Footer hint */}
      <p style={{
        marginTop: '8px', textAlign: 'center',
        fontSize: '11.5px', color: 'var(--text-muted)',
      }}>
        Answers are grounded strictly in the document. AI will indicate if information is unavailable.
      </p>

      <style>{`
        @media (max-width: 480px) { .hide-mobile { display: none; } }
      `}</style>
    </div>
  );
}
