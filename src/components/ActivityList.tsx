import React from 'react';
import { ActivityItem } from './ActivityItem';
import type { Activity } from '../types';

interface ActivityListProps {
  activities: Activity[];
}

export const ActivityList: React.FC<ActivityListProps> = ({ activities }) => {
  return (
    <section
      id="recent-activity-section"
      aria-label="Recent Activity"
      className="space-y-3"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Recent Activity
        </h2>
      </div>

      <div className="space-y-2">
        {activities.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </div>
    </section>
  );
};
