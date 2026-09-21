import React from 'react';
import type { TaskPriority } from '../types';

interface PriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, className = '' }) => {
  const getBadgeStyle = () => {
    switch (priority) {
      case 'High priority':
        return 'text-rose-700 bg-rose-50 border-rose-200/70';
      case 'Medium priority':
        return 'text-amber-700 bg-amber-50 border-amber-200/70';
      case 'Low priority':
      default:
        return 'text-zinc-600 bg-zinc-100 border-zinc-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border whitespace-nowrap ${getBadgeStyle()} ${className}`}
    >
      {priority}
    </span>
  );
};
