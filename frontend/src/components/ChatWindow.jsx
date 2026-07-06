import React, { useRef, useEffect } from 'react';
import { Download, Trash2, ArrowDownCircle } from 'lucide-react';
import MessageBubble from './MessageBubble';
import LoadingSkeleton from './LoadingSkeleton';

export default function ChatWindow({ messages, loading, onClearHistory, activeFilename }) {
  const bottomRef = useRef(null);

  // Auto-scroll on messages change or when active loading starts
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleDownloadChat = () => {
    if (messages.length === 0) return;

    let mdContent = `# Chat Transcript - Document AI Assistant\n`;
    mdContent += `**Document:** ${activeFilename || 'Unknown'}\n`;
    mdContent += `**Date:** ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n\n`;
    mdContent += `---\n\n`;

    messages.forEach((msg, idx) => {
      const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (msg.role === 'user') {
        mdContent += `### 👤 User (${time})\n\n${msg.content}\n\n`;
      } else {
        mdContent += `### 🤖 Assistant (${time})\n\n${msg.content}\n\n`;
        if (msg.sources && msg.sources.length > 0) {
          mdContent += `**Sources Used:**\n`;
          msg.sources.forEach((src) => {
            mdContent += `- Page ${src.page} (Chunk ID: ${src.chunk_id?.split('_')?.pop() || src.chunk_id}): *"${src.text.replace(/\n/g, ' ')}"* \n`;
          });
          mdContent += `\n`;
        }
        mdContent += `\n---\n\n`;
      }
    });

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `chat_${activeFilename.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col flex-1 h-[calc(100vh-10rem)] bg-white rounded-2xl border border-gray-150 shadow-soft overflow-hidden animate-fade-in">
      
      {/* Chat Window Header Actions */}
      <div className="flex items-center justify-between border-b border-gray-150 px-4 py-3 bg-gray-50/50">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-green-500"></span>
          <span className="text-xs font-bold text-gray-700">Chat Session</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadChat}
            disabled={messages.length === 0}
            className="flex items-center gap-1 text-[11px] font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 shadow-sm hover:bg-gray-50 active:scale-95 disabled:opacity-50 transition-all"
            title="Download Chat as Markdown"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download Chat</span>
          </button>
          
          <button
            onClick={onClearHistory}
            disabled={messages.length === 0}
            className="flex items-center gap-1 text-[11px] font-semibold text-red-600 bg-white border border-red-100 rounded-lg px-2.5 py-1.5 shadow-sm hover:bg-red-50 active:scale-95 disabled:opacity-50 transition-all"
            title="Clear current history"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear History</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Panel */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100 bg-gray-50/10">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-12">
            <ArrowDownCircle className="h-10 w-10 text-gray-300 animate-bounce mb-3" />
            <h4 className="text-sm font-semibold text-gray-800">Start the conversation</h4>
            <p className="text-xs text-gray-400 mt-1 max-w-sm">
              The document is ready! Ask questions about its contents below.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
        
        {loading && <LoadingSkeleton />}
        <div ref={bottomRef} />
      </div>

    </div>
  );
}
