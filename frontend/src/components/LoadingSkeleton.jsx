import React from 'react';
import { Bot } from 'lucide-react';

export default function LoadingSkeleton() {
  return (
    <div className="flex w-full gap-3 py-5 px-4 bg-gray-55/30 border-y border-gray-100/50 justify-start animate-pulse">
      <div className="flex w-full max-w-3xl gap-4">
        
        {/* Skeleton Avatar */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-150 bg-gray-100 text-gray-300">
          <Bot className="h-4.5 w-4.5" />
        </div>

        {/* Content Skeleton */}
        <div className="flex-1 space-y-3 pt-1">
          {/* Header */}
          <div className="h-3 w-24 rounded bg-gray-200"></div>
          
          {/* Body Lines */}
          <div className="space-y-2">
            <div className="h-4 w-11/12 rounded bg-gray-200"></div>
            <div className="h-4 w-4/5 rounded bg-gray-200"></div>
            <div className="h-4 w-2/3 rounded bg-gray-200"></div>
          </div>
          
          {/* Pulsing Dots typing animation */}
          <div className="flex items-center gap-1 mt-4">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>

      </div>
    </div>
  );
}
