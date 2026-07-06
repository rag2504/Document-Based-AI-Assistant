import React, { useRef, useEffect } from 'react';
import { Send, CornerDownLeft } from 'lucide-react';

export default function ChatInput({ value, onChange, onSubmit, disabled, placeholder }) {
  const textareaRef = useRef(null);

  // Auto-resize the input height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSubmit();
      }
    }
  };

  return (
    <div className="relative border-t border-gray-150 bg-white px-4 py-4 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (value.trim() && !disabled) onSubmit();
          }}
          className="relative flex items-center rounded-xl border border-gray-250 bg-white px-3 py-2 shadow-soft focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all"
        >
          {/* Text Area Input */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || "Ask a question about the document..."}
            disabled={disabled}
            className="block w-full resize-none border-0 bg-transparent py-1.5 pr-12 text-gray-900 placeholder-gray-400 focus:ring-0 sm:text-sm outline-none max-h-40 min-h-[24px]"
          />

          {/* Buttons and Indicator */}
          <div className="absolute right-2.5 bottom-2 flex items-center gap-1.5">
            {/* Keyboard hint */}
            <span className="hidden sm:inline-flex items-center gap-0.5 text-[9px] font-bold text-gray-400 select-none mr-1">
              <span>Enter</span>
              <CornerDownLeft className="h-2 w-2" />
            </span>
            
            <button
              type="submit"
              disabled={!value.trim() || disabled}
              className={`flex h-8 w-8 items-center justify-center rounded-lg shadow-sm transition-all active:scale-95
                ${value.trim() && !disabled
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/10'
                  : 'bg-gray-100 text-gray-400 border border-gray-150 cursor-not-allowed'
                }`}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
        
        {/* Footnote instruction */}
        <p className="mt-1.5 text-center text-[10px] text-gray-400">
          Answers are generated strictly using the document. AI will tell you if information is missing.
        </p>
      </div>
    </div>
  );
}
