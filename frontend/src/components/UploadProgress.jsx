import React from 'react';
import { Loader2, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function UploadProgress({ status, progress, filename, error, onRetry }) {
  // status can be: 'idle', 'uploading', 'indexing', 'success', 'error'

  if (status === 'idle') return null;

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl border border-gray-100 p-6 shadow-premium animate-fade-in">
      <div className="flex items-start gap-4">
        
        {/* State Icon Indicator */}
        <div className="shrink-0">
          {status === 'uploading' && (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}
          {status === 'indexing' && (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-50 text-yellow-600">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}
          {status === 'success' && (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          )}
          {status === 'error' && (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <ShieldAlert className="h-5 w-5" />
            </div>
          )}
        </div>

        {/* Details & Progress Meter */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {filename}
            </h3>
            {(status === 'uploading' || status === 'indexing') && (
              <span className="text-xs font-semibold text-blue-600">
                {status === 'uploading' ? `Uploading ${progress}%` : 'Indexing...'}
              </span>
            )}
          </div>

          {/* Status descriptive labels */}
          <p className="mt-1 text-xs text-gray-500">
            {status === 'uploading' && 'Sending file bytes to backend server...'}
            {status === 'indexing' && 'Extracting text and generating sentence embeddings using MiniLM model. This may take a moment...'}
            {status === 'success' && 'Document successfully chunked, embedded, and cached inside persistent ChromaDB.'}
            {status === 'error' && error}
          </p>

          {/* Progress bar container */}
          {(status === 'uploading' || status === 'indexing') && (
            <div className="mt-3.5 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-200 ${
                  status === 'indexing' ? 'w-full bg-yellow-500 animate-pulse' : 'bg-blue-600'
                }`}
                style={{ width: status === 'uploading' ? `${progress}%` : undefined }}
              ></div>
            </div>
          )}

          {/* Success Summary details */}
          {status === 'success' && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-600/20">
              Document Indexed Successfully
            </div>
          )}

          {/* Retry mechanism on Error */}
          {status === 'error' && onRetry && (
            <button
              onClick={onRetry}
              className="mt-3.5 inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
            >
              Reset and Retry
            </button>
          )}

        </div>

      </div>
    </div>
  );
}
