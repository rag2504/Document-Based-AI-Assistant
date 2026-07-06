import React from 'react';
import { Layers } from 'lucide-react';

export default function EmptyState({ children }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl text-center">
        
        {/* Welcome Icon */}
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-inner">
          <Layers className="h-7 w-7" />
        </div>

        {/* Headline */}
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
          Document-Based <span className="text-blue-600">AI Assistant</span>
        </h1>
        
        {/* Subtitle */}
        <p className="mx-auto mt-4 max-w-lg text-base text-gray-500 sm:text-lg">
          Upload a PDF or TXT document, and ask questions grounded strictly in its contents. No hallucinations, full citations.
        </p>

        {/* Upload Slot */}
        <div className="mt-10 text-left">
          {children}
        </div>

        {/* Bottom Metadata/Footer */}
        <div className="mt-8 text-center text-xs text-gray-400">
          Powered by Google Gemini & ChromaDB. Chunks and embeddings are preserved locally.
        </div>

      </div>
    </div>
  );
}
