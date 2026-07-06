import React, { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import UploadCard from './UploadCard';
import { Sparkles } from 'lucide-react';

const EMPTY_PROMPTS = [
  '📄 Summarize this document',
  '🔍 What are the key points?',
  '💡 List the main topics covered',
  '📊 Are there any statistics or data?',
];

export default function ChatArea({
  messages,
  isChatLoading,
  streamingMessageId,
  activeFilename,
  uploadChunks,
  uploadedAt,
  onSuggestedPrompt,
  onRegenerate,
  onReplace,
}) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatLoading]);

  return (
    <div className="chat-scroll" style={{ flex: 1, overflowY: 'auto' }}>
      <div className="messages-container">
        {/* Upload card */}
        {activeFilename && (
          <UploadCard
            filename={activeFilename}
            chunks={uploadChunks}
            uploadedAt={uploadedAt}
            onReplace={onReplace}
          />
        )}

        {/* Empty state */}
        {messages.length === 0 && !isChatLoading && (
          <div className="animate-fade-slide-in" style={{ textAlign: 'center', padding: '32px 0 16px' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '14px',
              background: 'linear-gradient(135deg, #2563EB15, #8B5CF615)',
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px', fontSize: '24px',
            }}>
              ✦
            </div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>
              Ready to answer your questions
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: '0 0 20px' }}>
              The document is indexed. Ask anything about its contents.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
              {EMPTY_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => onSuggestedPrompt?.(p.slice(2).trim())}
                  className="prompt-chip"
                  style={{ fontSize: '13px' }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.map((msg, idx) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isStreaming={msg.id === streamingMessageId && isChatLoading}
            onRegenerate={
              msg.role === 'assistant' && idx === messages.length - 1 && !isChatLoading
                ? onRegenerate
                : undefined
            }
          />
        ))}

        {/* Typing indicator: show if loading but streaming content hasn't started yet */}
        {isChatLoading && (
          (() => {
            const lastMsg = messages[messages.length - 1];
            const showDots = !lastMsg || lastMsg.role === 'user' || (lastMsg.role === 'assistant' && !lastMsg.content);
            return showDots ? <TypingIndicator /> : null;
          })()
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
