import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import type { TaskFilter, TaskSortOption } from '../types';

interface TaskFiltersProps {
  currentFilter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
  currentSort: TaskSortOption;
  onSortChange: (sort: TaskSortOption) => void;
  counts: {
    all: number;
    today: number;
    upcoming: number;
    completed: number;
  };
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  currentFilter,
  onFilterChange,
  currentSort,
  onSortChange,
  counts,
}) => {
  const filterOptions: { id: TaskFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'today', label: 'Today', count: counts.today },
    { id: 'upcoming', label: 'Upcoming', count: counts.upcoming },
    { id: 'completed', label: 'Completed', count: counts.completed },
  ];

  return (
    <div
      id="task-filters-bar"
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1"
    >
      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        {filterOptions.map((opt) => {
          const isActive = currentFilter === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              id={`filter-tab-${opt.id}`}
              onClick={() => onFilterChange(opt.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-zinc-900 text-white shadow-2xs'
                  : 'bg-white text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border border-zinc-200/80'
              }`}
            >
              <span>{opt.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                  isActive
                    ? 'bg-zinc-800 text-zinc-200'
                    : 'bg-zinc-100 text-zinc-500'
                }`}
              >
                {opt.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sort Selector */}
      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
        <label
          htmlFor="task-sort-select"
          className="text-xs text-zinc-500 flex items-center gap-1 font-medium"
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
          <span>Sort:</span>
        </label>
        <select
          id="task-sort-select"
          value={currentSort}
          onChange={(e) => onSortChange(e.target.value as TaskSortOption)}
          className="bg-white text-zinc-800 text-xs font-medium py-1.5 pl-2.5 pr-7 rounded-lg border border-zinc-200 hover:border-zinc-300 focus:outline-none focus:border-zinc-400 cursor-pointer shadow-2xs"
        >
          <option value="due_date">Due date</option>
          <option value="priority">Priority (High to Low)</option>
          <option value="title">Title (A–Z)</option>
        </select>
      </div>
    </div>
  );
};
