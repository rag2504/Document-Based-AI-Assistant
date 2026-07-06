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
    <div className="chat-pane">
      <div className="chat-scroll" ref={scrollRef} onScroll={handleScroll}>
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
