import React from 'react';
import { TaskItem } from './TaskItem';
import type { Task } from '../types';

interface TaskListProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onViewAll?: () => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onToggleTask,
  onViewAll,
}) => {
  return (
    <section id="todays-tasks-section" aria-label="Today's Tasks" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Today&apos;s Tasks
        </h2>
        <button
          type="button"
          id="view-all-tasks-btn"
          onClick={onViewAll}
          className="text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors inline-flex items-center gap-1 cursor-pointer"
        >
          <span>View all tasks</span>
          <span aria-hidden="true">&rarr;</span>
        </button>
      </div>

      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onToggle={onToggleTask}
            compact
          />
        ))}
      </div>
    </section>
  );
};
