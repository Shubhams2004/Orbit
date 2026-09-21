import React from 'react';
import type { ComponentType } from 'react';

interface SuggestionButtonProps {
  id?: string;
  label: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
  onClick?: () => void;
}

export const SuggestionButton: React.FC<SuggestionButtonProps> = ({
  id,
  label,
  description,
  icon: Icon,
  onClick,
}) => {
  return (
    <button
      type="button"
      id={id || `suggestion-${label.toLowerCase().replace(/\s+/g, '-')}`}
      onClick={onClick}
      className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 text-left bg-white hover:bg-zinc-50/80 border border-zinc-200/90 hover:border-zinc-300 rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 cursor-pointer shadow-xs"
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700 group-hover:text-zinc-900 group-hover:bg-zinc-200/70 transition-colors shrink-0">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <div>
          <span className="text-sm font-medium text-zinc-900 block leading-snug">
            {label}
          </span>
          {description && (
            <span className="text-xs text-zinc-500 block mt-0.5 font-normal">
              {description}
            </span>
          )}
        </div>
      </div>
      <span className="hidden sm:inline-flex text-xs text-zinc-400 group-hover:text-zinc-600 transition-colors font-mono">
        ↵
      </span>
    </button>
  );
};
