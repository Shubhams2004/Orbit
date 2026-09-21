import React from 'react';
import type { ComponentType } from 'react';

interface OverviewCardProps {
  id?: string;
  label: string;
  count: number | string;
  icon: ComponentType<{ className?: string }>;
  iconColorClass?: string;
}

export const OverviewCard: React.FC<OverviewCardProps> = ({
  id,
  label,
  count,
  icon: Icon,
  iconColorClass = 'text-zinc-500 bg-zinc-100',
}) => {
  return (
    <div
      id={id}
      className="p-4 bg-white border border-zinc-200/90 rounded-xl shadow-xs transition-colors hover:border-zinc-300"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-zinc-500 truncate">
          {label}
        </span>
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${iconColorClass}`}
        >
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <div className="mt-2.5 flex items-baseline">
        <span className="text-2xl sm:text-3xl font-semibold text-zinc-900 tracking-tight">
          {count}
        </span>
      </div>
    </div>
  );
};
