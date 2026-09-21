import React, { useRef, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

interface MessageComposerProps {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = 'Ask a question or request a task...',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        140
      )}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSend();
      }
    }
  };

  const canSend = Boolean(value.trim()) && !disabled;

  return (
    <div
      id="message-composer"
      className="bg-white border border-zinc-200/90 rounded-2xl p-2 sm:p-2.5 shadow-sm transition-all focus-within:border-zinc-400 focus-within:ring-2 focus-within:ring-zinc-900/5"
    >
      <label htmlFor="assistant-message-input" className="sr-only">
        Message Assistant
      </label>
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          id="assistant-message-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          disabled={disabled}
          className="w-full resize-none max-h-36 px-2.5 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 bg-transparent border-none focus:outline-none focus:ring-0 leading-relaxed"
        />

        {/* Send Button */}
        <button
          type="button"
          id="send-message-btn"
          onClick={onSend}
          disabled={!canSend}
          aria-label="Send message"
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-150 ${
            canSend
              ? 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-xs cursor-pointer'
              : 'bg-zinc-100 text-zinc-300 cursor-not-allowed'
          }`}
        >
          <ArrowUp className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-zinc-400">
        <span className="hidden sm:inline">
          Press <kbd className="font-mono bg-zinc-100 px-1 py-0.5 rounded text-zinc-600">Enter ↵</kbd> to send, <kbd className="font-mono bg-zinc-100 px-1 py-0.5 rounded text-zinc-600">Shift + Enter</kbd> for new line
        </span>
        <span className="sm:hidden">
          Tap arrow to send
        </span>
        <span>Local assistant preview</span>
      </div>
    </div>
  );
};
