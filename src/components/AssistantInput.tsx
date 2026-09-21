import React, { useRef, useEffect } from 'react';
import { ArrowUp, Sparkles, CornerDownLeft } from 'lucide-react';

interface AssistantInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder?: string;
  id?: string;
}

export const AssistantInput: React.FC<AssistantInputProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = 'What can I help you with?',
  id = 'assistant-main-input',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.max(100, Math.min(scrollHeight, 260))}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        onSubmit(value.trim());
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value.trim());
    }
  };

  return (
    <form
      id="assistant-input-form"
      onSubmit={handleSubmit}
      className="w-full bg-white rounded-2xl border border-zinc-200/90 shadow-xs hover:border-zinc-300 focus-within:border-zinc-400 focus-within:ring-4 focus-within:ring-zinc-900/5 transition-all duration-150 overflow-hidden"
    >
      <div className="p-4 sm:p-5">
        <label htmlFor={id} className="sr-only">
          {placeholder}
        </label>
        <textarea
          ref={textareaRef}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={3}
          className="w-full resize-none bg-transparent text-zinc-900 placeholder:text-zinc-400 text-base sm:text-lg leading-relaxed focus:outline-none"
        />
      </div>

      <div className="flex items-center justify-between px-4 sm:px-5 py-3 bg-zinc-50/60 border-t border-zinc-100">
        <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden sm:inline">Orbit Assistant ready</span>
          <span className="inline sm:hidden">Ready</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:flex items-center gap-1 text-[11px] text-zinc-400 font-medium mr-1">
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 bg-white border border-zinc-200 rounded text-[10px] text-zinc-600 font-mono shadow-2xs inline-flex items-center">
              <CornerDownLeft className="w-2.5 h-2.5" />
            </kbd>
            <span>to submit</span>
          </span>

          <button
            type="submit"
            id="assistant-submit-btn"
            disabled={!value.trim()}
            aria-label="Send request"
            className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150 ${
              value.trim()
                ? 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-xs cursor-pointer'
                : 'bg-zinc-100 text-zinc-300 cursor-not-allowed'
            }`}
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </form>
  );
};
