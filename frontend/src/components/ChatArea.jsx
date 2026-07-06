import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MessageBubble from './MessageBubble';
import { ArrowDown } from 'lucide-react';

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
  onCitationHover,
}) {
  const scrollRef = useRef(null);
  const bottomRef = useRef(null);
  const [showScrollBtn, setShowScrollBtn] = React.useState(false);

  // Auto-scroll on new messages
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 200);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');

  return (
    <div className="chat-pane" style={{ position: 'relative', background: 'linear-gradient(145deg, var(--bg-2) 0%, var(--bg) 100%)' }}>
      {/* Dynamic Grid Background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(var(--border-strong) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          opacity: 0.3,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      
      {/* Subtle Glows */}
      <div style={{ position: 'absolute', top: -100, left: -100, width: 400, height: 400, background: 'var(--accent)', opacity: 0.06, filter: 'blur(100px)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: 100, right: -100, width: 400, height: 400, background: '#10b981', opacity: 0.04, filter: 'blur(100px)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0 }} />

      <div className="chat-scroll" ref={scrollRef} onScroll={handleScroll} style={{ position: 'relative', zIndex: 1 }}>
        <div className="chat-messages">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isStreaming={msg.id === streamingMessageId}
              onCitationHover={onCitationHover}
              onRegenerate={
                msg.role === 'assistant' && !isChatLoading && msg.id === lastAssistantMsg?.id
                  ? onRegenerate
                  : undefined
              }
            />
          ))}
          <div ref={bottomRef} style={{ height: 1 }} />
        </div>
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={scrollToBottom}
            style={{
              position: 'absolute',
              bottom: 130,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 'var(--r-full)',
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-med)',
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: 'var(--s-2)',
              fontFamily: 'var(--font-sans)',
              zIndex: 10,
            }}
          >
            <ArrowDown size={13} />
            Scroll to bottom
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
