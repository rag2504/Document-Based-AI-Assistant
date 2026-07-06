import React, { useState, useCallback } from 'react';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, ThumbsUp, ThumbsDown, RefreshCw, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import PresentationEngine from './PresentationEngine';

// ── Code block with copy button ──────────────────────────────────────────────
function CodeBlock({ lang, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-block">
      <div className="code-block-bar">
        <span className="code-lang">{lang || 'code'}</span>
        <button
          className={`code-copy-btn ${copied ? 'copied' : ''}`}
          onClick={handleCopy}
          title="Copy code"
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre><code>{code}</code></pre>
    </div>
  );
}

// ── Source citations panel ────────────────────────────────────────────────────
function SourcesPanel({ sources, onCitationHover }) {
  const [open, setOpen] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState(null);

  if (!sources || sources.length === 0) return null;

  const shortId = (id) => {
    if (!id) return '—';
    const parts = id.split('_');
    return parts.length > 1 ? `#${parts[parts.length - 1]}` : id.slice(-4);
  };

  return (
    <div className="sources-section">
      <button
        className="sources-toggle"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
      >
        <BookOpen size={12} />
        <span>{sources.length} source reference{sources.length !== 1 ? 's' : ''}</span>
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="source-cards"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            style={{ overflow: 'hidden' }}
          >
            {sources.map((src, i) => {
              const isExpanded = expandedIdx === i;
              return (
                <div
                  key={src.chunk_id || i}
                  className={`source-card ${isExpanded ? 'expanded' : ''}`}
                  onClick={() => setExpandedIdx(isExpanded ? null : i)}
                  onMouseEnter={() => onCitationHover && onCitationHover(src.chunk_id)}
                  onMouseLeave={() => onCitationHover && onCitationHover(null)}
                >
                  <div className="source-card-header">
                    <div className="source-card-meta">
                      <div className="source-index">{i + 1}</div>
                      <span className="source-label">Source {i + 1}</span>
                      {src.page != null && (
                        <span className="source-page-badge">
                          Page {src.page}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {shortId(src.chunk_id)}
                      </span>
                      {isExpanded ? <ChevronUp size={13} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={13} style={{ color: 'var(--text-muted)' }} />}
                    </div>
                  </div>

                  <AnimatePresence initial={false}>
                    {isExpanded && src.text && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <p className="source-snippet">
                          "{src.text.length > 450 ? src.text.slice(0, 450) + '…' : src.text}"
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main MessageBubble ────────────────────────────────────────────────────────
export default function MessageBubble({ message, onRegenerate, isStreaming, onCitationHover }) {
  const { role, content, sources, timestamp } = message;
  const isUser = role === 'user';
  const [copied, setCopied] = useState(false);
  const [reaction, setReaction] = useState(null);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content]);

  const formatTime = (iso) => {
    try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  };

  // ── User bubble ──
  if (isUser) {
    return (
      <motion.div
        className="msg-user"
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, maxWidth: '75%' }}>
          <div className="msg-user-bubble">{content}</div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{formatTime(timestamp)}</span>
        </div>
      </motion.div>
    );
  }

  // ── Assistant message ──
  return (
    <motion.div
      className="msg-assistant"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
    >
      {/* Avatar + name */}
      <div className="msg-assistant-header">
        <div className="msg-ai-avatar">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
        </div>
        <span className="msg-ai-name">Omnidoc</span>
        <span className="msg-ai-time">{formatTime(timestamp)}</span>
      </div>

      {/* Content */}
      <div className={`msg-ai-content ${isStreaming && !content ? '' : ''}`}>
        {content ? (
          <div className={`prose ${isStreaming ? 'streaming-cursor' : ''}`}>
            <PresentationEngine
              content={content}
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  if (inline) {
                    return <code {...props}>{children}</code>;
                  }
                  const lang = (className || '').replace('language-', '');
                  const code = String(children).replace(/\n$/, '');
                  return <CodeBlock lang={lang} code={code} />;
                },
                pre({ children }) {
                  return <>{children}</>;
                },
                table({ children }) {
                  return <div className="prose-table-wrap"><table>{children}</table></div>;
                },
                li({ children, className, ...props }) {
                  const isTask = className === 'task-list-item';
                  return <li className={isTask ? 'task-list-item' : ''} {...props}>{children}</li>;
                },
                blockquote({ children }) {
                  return <blockquote>{children}</blockquote>;
                },
              }}
            />
          </div>
        ) : isStreaming ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0' }}>
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </div>
        ) : null}
      </div>

      {/* Sources */}
      {!isStreaming && sources && sources.length > 0 && (
        <SourcesPanel sources={sources} onCitationHover={onCitationHover} />
      )}

      {/* Actions */}
      {content && !isStreaming && (
        <div className="msg-actions">
          <button
            className={`msg-action-btn ${copied ? 'active' : ''}`}
            onClick={handleCopy}
            title="Copy response"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            className={`msg-action-btn ${reaction === 'up' ? 'active' : ''}`}
            onClick={() => setReaction(r => r === 'up' ? null : 'up')}
            title="Good response"
          >
            <ThumbsUp size={12} />
          </button>

          <button
            className={`msg-action-btn ${reaction === 'down' ? 'active' : ''}`}
            onClick={() => setReaction(r => r === 'down' ? null : 'down')}
            title="Poor response"
            style={reaction === 'down' ? { background: 'var(--error-subtle)', color: 'var(--error)', borderColor: 'transparent' } : {}}
          >
            <ThumbsDown size={12} />
          </button>

          {onRegenerate && (
            <button className="msg-action-btn" onClick={onRegenerate} title="Regenerate response">
              <RefreshCw size={12} />
              <span>Retry</span>
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
