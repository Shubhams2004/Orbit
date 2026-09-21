import React from 'react';
import { Bot } from 'lucide-react';

export const ThinkingIndicator: React.FC = () => {
  return (
    <div
      id="thinking-indicator"
      className="flex items-start gap-3 text-left w-full max-w-2xl animate-fade-in"
      aria-live="polite"
      aria-label="Assistant is thinking"
    >
      {/* Assistant avatar */}
      <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center shrink-0 shadow-2xs">
        <Bot className="w-4 h-4" />
      </div>

      {/* Bubble */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl rounded-tl-sm px-4 py-3 shadow-xs inline-flex items-center gap-2">
        <span className="text-xs font-medium text-zinc-500">Thinking</span>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" />
        </div>
      </div>
    </div>
  );
};
