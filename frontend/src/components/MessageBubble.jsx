import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, ThumbsUp, ThumbsDown, RefreshCw, User } from 'lucide-react';
import SourcePanel from './SourcePanel';

export default function MessageBubble({ message, onRegenerate, isStreaming }) {
  const { role, content, sources, timestamp } = message;
  const isUser = role === 'user';
  const [copied, setCopied] = useState(false);
  const [reaction, setReaction] = useState(null); // 'up' | 'down'

  const handleCopy = () => {
    navigator.clipboard.writeText(content).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (iso) => {
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  if (isUser) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'flex-end',
        alignItems: 'flex-end', gap: '10px',
      }}>
        <div style={{ maxWidth: '80%' }}>
          <div style={{ textAlign: 'right', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {formatTime(timestamp)}
            </span>
          </div>
          <div className="user-bubble">
            <p style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {content}
            </p>
          </div>
        </div>
        <div style={{
          width: '32px', height: '32px', borderRadius: '10px',
          background: 'linear-gradient(135deg, #2563EB, #3B82F6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
        }}>
          <User size={16} color="white" />
        </div>
      </div>
    );
  }

  return (
    <div className="ai-message-wrapper" style={{
      display: 'flex', alignItems: 'flex-start', gap: '10px',
    }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '10px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, boxShadow: 'var(--shadow-xs)',
        fontSize: '16px', lineHeight: 1,
      }}>
        ?
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
            DocAI
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {formatTime(timestamp)}
          </span>
        </div>

        <div className={`ai-card ${isStreaming ? 'streaming-cursor' : ''}`}>
          {content ? (
            <div className="prose-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    if (inline) {
                      return <code className="inline-code" {...props}>{children}</code>;
                    }
                    const lang = (className || '').replace('language-', '');
                    return (
                      <div className="code-block-wrapper">
                        {lang && (
                          <div className="code-block-header">
                            <span className="code-lang-label">{lang}</span>
                          </div>
                        )}
                        <pre style={{ margin: 0 }}>
                          <code {...props}>{children}</code>
                        </pre>
                      </div>
                    );
                  },
                  table({ children }) {
                    return (
                      <div className="prose-table-wrapper">
                        <table>{children}</table>
                      </div>
                    );
                  },
                  li({ children, className, ...props }) {
                    const isTask = className === 'task-list-item';
                    if (isTask) {
                      return <li className="task-list-item" {...props}>{children}</li>;
                    }
                    return <li {...props}>{children}</li>;
                  },
                  blockquote({ children }) {
                    return <blockquote className="prose-blockquote">{children}</blockquote>;
                  },
                  h1({ children }) {
                    return <h1 className="prose-h1">{children}</h1>;
                  },
                  h2({ children }) {
                    return <h2 className="prose-h2">{children}</h2>;
                  },
                  h3({ children }) {
                    return <h3 className="prose-h3">{children}</h3>;
                  },
                  hr() {
                    return <hr className="prose-hr" />;
                  },
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          ) : (
            isStreaming && (
              <div style={{ height: '20px' }} />
            )
          )}
        </div>

        {sources && sources.length > 0 && !isStreaming && (
          <SourcePanel sources={sources} />
        )}

        {content && !isStreaming && (
          <div className="msg-actions">
            <button onClick={handleCopy} className="msg-action-btn" title="Copy response">
              {copied ? (
                <><Check size={13} style={{ color: '#10B981' }} /><span style={{ color: '#10B981' }}>Copied</span></>
              ) : (
                <><Copy size={13} /><span>Copy</span></>
              )}
            </button>
            <button
              onClick={() => setReaction(reaction === 'up' ? null : 'up')}
              className="msg-action-btn"
              title="Good response"
              style={reaction === 'up' ? { color: '#10B981', borderColor: '#10B981', background: '#F0FDF4' } : {}}
            >
              <ThumbsUp size={13} />
            </button>
            <button
              onClick={() => setReaction(reaction === 'down' ? null : 'down')}
              className="msg-action-btn"
              title="Bad response"
              style={reaction === 'down' ? { color: '#EF4444', borderColor: '#EF4444', background: '#FEF2F2' } : {}}
            >
              <ThumbsDown size={13} />
            </button>
            {onRegenerate && (
              <button onClick={onRegenerate} className="msg-action-btn" title="Regenerate">
                <RefreshCw size={13} />
                <span>Regenerate</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
