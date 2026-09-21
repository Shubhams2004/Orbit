import React from 'react';
import type { ComponentType } from 'react';

interface CapabilityCardProps {
  id?: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  onClick?: () => void;
}

export const CapabilityCard: React.FC<CapabilityCardProps> = ({
  id,
  icon: Icon,
  title,
  description,
  onClick,
}) => {
  return (
    <div
      id={id}
      onClick={onClick}
      className={`p-3.5 bg-white border border-zinc-200/80 rounded-xl transition-all duration-150 ${
        onClick
          ? 'cursor-pointer hover:border-zinc-300 hover:bg-zinc-50/70 hover:shadow-xs'
          : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-zinc-100 text-zinc-700 shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-semibold text-zinc-900">{title}</h4>
          <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};
