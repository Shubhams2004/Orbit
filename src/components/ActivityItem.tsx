import React from 'react';
import { Plus, Check, Zap } from 'lucide-react';
import type { Activity } from '../types';

interface ActivityItemProps {
  activity: Activity;
}

export const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => {
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'created':
        return {
          Icon: Plus,
          colorClass: 'text-zinc-600 bg-zinc-100 border-zinc-200',
        };
      case 'completed':
        return {
          Icon: Check,
          colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-200/70',
        };
      case 'automation':
        return {
          Icon: Zap,
          colorClass: 'text-sky-700 bg-sky-50 border-sky-200/70',
        };
      default:
        return {
          Icon: Plus,
          colorClass: 'text-zinc-600 bg-zinc-100 border-zinc-200',
        };
    }
  };

  const { Icon, colorClass } = getActivityIcon(activity.type);

  return (
    <div
      id={`activity-item-${activity.id}`}
      className="flex items-center justify-between gap-3 p-3 bg-white border border-zinc-200/70 rounded-xl shadow-xs"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div
          className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${colorClass}`}
        >
          <Icon className="w-3.5 h-3.5" />
        </div>
        <span className="text-sm text-zinc-800 font-medium truncate">
          {activity.text}
        </span>
      </div>

      <span className="text-xs text-zinc-400 shrink-0 font-normal">
        {activity.timestamp}
      </span>
    </div>
  );
};
