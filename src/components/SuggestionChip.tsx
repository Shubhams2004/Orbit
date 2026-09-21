import React from 'react';
import type { ComponentType } from 'react';

interface SuggestionChipProps {
  id?: string;
  text: string;
  icon?: ComponentType<{ className?: string }>;
  onClick: (text: string) => void;
}

export const SuggestionChip: React.FC<SuggestionChipProps> = ({
  id,
  text,
  icon: Icon,
  onClick,
}) => {
  return (
    <button
      type="button"
      id={id}
      onClick={() => onClick(text)}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-100 hover:text-zinc-950 border border-zinc-200/80 transition-all duration-150 cursor-pointer shadow-2xs whitespace-normal text-left"
    >
      {Icon && <Icon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />}
      <span>{text}</span>
    </button>
  );
};
