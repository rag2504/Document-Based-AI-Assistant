import React from 'react';
import { FileText, RefreshCw, Layers } from 'lucide-react';

export default function Navbar({ activeFile, onReset, isResetting }) {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-gray-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo and Title */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <Layers className="h-5.5 w-5.5" />
          </div>
          <div>
            <span className="text-base font-bold text-gray-900 leading-none block">DocAssistant</span>
            <span className="text-xs text-gray-500 mt-0.5 block">Document RAG Engine</span>
          </div>
        </div>

        {/* Active File State & Actions */}
        <div className="flex items-center gap-3">
          {activeFile ? (
            <>
              <div className="hidden sm:flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-1.5 text-xs font-medium text-blue-700">
                <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                <span className="truncate max-w-[200px]">{activeFile}</span>
              </div>
              
              <button
                onClick={onReset}
                disabled={isResetting}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:text-gray-950 active:scale-95 disabled:opacity-50"
                title="Upload another document"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                <span>Reset</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="h-2 w-2 rounded-full bg-gray-300 animate-pulse"></span>
              <span>No document loaded</span>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
