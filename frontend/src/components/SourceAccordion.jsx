import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';

export default function SourceAccordion({ sources }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3.5 border border-gray-150 rounded-xl overflow-hidden bg-gray-50/50">
      
      {/* Header / Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100/75 transition-colors border-b border-gray-150 text-left text-xs font-semibold text-gray-700"
      >
        <div className="flex items-center gap-1.5 text-gray-600">
          <FileText className="h-4 w-4 text-blue-500" />
          <span>View Grounding Sources ({sources.length})</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto px-4 py-1.5 bg-white">
          {sources.map((source, index) => (
            <div key={source.chunk_id || index} className="py-2.5 first:pt-1 last:pb-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-400">
                <span className="text-blue-600">Source #{index + 1}</span>
                <div className="flex items-center gap-2">
                  <span className="bg-gray-150 text-gray-600 px-1.5 py-0.5 rounded">
                    Page {source.page}
                  </span>
                  <span className="text-gray-400 font-mono text-[9px]">
                    ID: {source.chunk_id?.split('_')?.pop() || source.chunk_id}
                  </span>
                </div>
              </div>
              <p className="mt-1.5 text-xs text-gray-600 leading-relaxed italic bg-gray-50/30 border-l-2 border-gray-200 pl-2 py-0.5 select-text">
                "{source.text}"
              </p>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
