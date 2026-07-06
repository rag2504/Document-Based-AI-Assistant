import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check, Bot, User } from 'lucide-react';
import SourceAccordion from './SourceAccordion';

export default function MessageBubble({ message }) {
  const { role, content, sources, timestamp } = message;
  const isUser = role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex w-full gap-3 py-4 px-4 ${isUser ? 'justify-end bg-white' : 'justify-start bg-gray-55/30 border-y border-gray-100/50'}`}>
      <div className={`flex w-full max-w-3xl gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg shadow-sm border
          ${isUser 
            ? 'bg-blue-600 border-blue-500 text-white' 
            : 'bg-white border-gray-200 text-gray-700'
          }`}
        >
          {isUser ? <User className="h-4.5 w-4.5" /> : <Bot className="h-4.5 w-4.5 text-blue-600" />}
        </div>

        {/* Message Content Container */}
        <div className="flex-1 overflow-hidden">
          
          {/* Header name / timestamp */}
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-xs font-bold text-gray-800">
              {isUser ? 'You' : 'Document AI'}
            </span>
            <span className="text-[10px] text-gray-400">
              {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Message Text Bubble */}
          <div className={`text-sm text-gray-800 leading-relaxed select-text
            ${isUser ? 'font-medium' : 'prose prose-sm max-w-none text-gray-850'}`}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap">{content}</p>
            ) : (
              <div className="markdown-content">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            )}
          </div>

          {/* Citations & Source Accordion */}
          {!isUser && sources && sources.length > 0 && (
            <SourceAccordion sources={sources} />
          )}

          {/* Copy Button & Action panel */}
          {!isUser && content && (
            <div className="mt-2.5 flex items-center justify-start gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-gray-600 bg-white border border-gray-150 rounded px-2 py-1 shadow-sm active:scale-95 transition-all"
                title="Copy response to clipboard"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-green-500" />
                    <span className="text-green-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
