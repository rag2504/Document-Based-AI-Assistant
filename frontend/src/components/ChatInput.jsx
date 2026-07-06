import React, { useRef, useEffect } from 'react';
import { Send, Paperclip } from 'lucide-react';

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
      el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    }
  }, [value]);

  // Focus on mount
  useEffect(() => {
    if (!disabled) textareaRef.current?.focus();
  }, [disabled]);

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
  const showCount = charCount > 400;
  const countClass = charCount > 900 ? 'error' : charCount > 700 ? 'warning' : '';

  return (
    <div className="input-region">
      <div className="input-container">
        <form onSubmit={handleSubmit}>
          <div className="input-wrapper">
            <div className="input-top">
              {/* Attach button */}
              {onAttach && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt"
                    style={{ display: 'none' }}
                    onChange={e => { if (e.target.files?.[0]) onAttach(e.target.files[0]); }}
                  />
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled}
                    title="Attach document"
                    aria-label="Attach document"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <Paperclip size={16} />
                  </button>
                </>
              )}

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                rows={1}
                value={value}
                onChange={e => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={disabled ? 'Generating response…' : (placeholder || 'Ask a question about the document…')}
                disabled={disabled}
                className="input-textarea"
                aria-label="Message input"
                aria-multiline="true"
              />

              {/* Send button */}
              <button
                type="submit"
                disabled={!canSend}
                className="send-btn"
                aria-label="Send message"
                title="Send (Enter)"
              >
                {disabled ? (
                  <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                ) : (
                  <Send size={15} />
                )}
              </button>
            </div>

            {/* Bottom bar */}
            <div className="input-bottom">
              <div className="input-hint">
                {!disabled && (
                  <>
                    <span className="input-kbd">Enter</span>
                    <span>to send</span>
                    <span style={{ margin: '0 4px', opacity: 0.4 }}>·</span>
                    <span className="input-kbd">Shift+Enter</span>
                    <span>for newline</span>
                  </>
                )}
                {disabled && <span>Generating response…</span>}
              </div>

              {showCount && (
                <span className={`input-char-count ${countClass}`}>
                  {charCount} / 1000
                </span>
              )}
            </div>
          </div>
        </form>

        <p className="input-footer">
          Responses are grounded strictly in your document. Always verify important information.
        </p>
      </div>
    </div>
  );
}
