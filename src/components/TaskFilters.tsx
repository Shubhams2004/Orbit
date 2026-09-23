import React from 'react';
import { ArrowUpDown, FolderKanban, Filter } from 'lucide-react';
import type { TaskFilter, TaskSortOption, Project } from '../types';

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
  // S5.4: Task Organization Project Filtering
  selectedProjectId?: string; // 'all' | 'unassigned' | projectId
  onProjectFilterChange?: (projectId: string) => void;
  projects?: Project[];
  projectCounts?: {
    all: number;
    unassigned: number;
    byProject: Record<string, number>;
  };
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  currentFilter,
  onFilterChange,
  currentSort,
  onSortChange,
  counts,
  selectedProjectId = 'all',
  onProjectFilterChange,
  projects = [],
  projectCounts,
}) => {
  const filterOptions: { id: TaskFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'today', label: 'Today', count: counts.today },
    { id: 'upcoming', label: 'Upcoming', count: counts.upcoming },
    { id: 'completed', label: 'Completed', count: counts.completed },
  ];

  return (
    <div id="task-filters-bar" className="space-y-3 pt-1">
      {/* Top Filter Bar: Status tabs + Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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

      {/* S5.4: Project Organization Filter Section (Miller's Law & Fitts's Law) */}
      {onProjectFilterChange && (
        <div
          id="task-project-filter-section"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2.5 border-t border-zinc-100"
        >
          {/* Quick Project Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <div className="flex items-center gap-1 text-xs text-zinc-500 font-medium mr-1 shrink-0">
              <FolderKanban className="w-3.5 h-3.5 text-zinc-400" />
              <span>Project:</span>
            </div>

            {/* All Tasks Pill */}
            <button
              type="button"
              id="project-filter-all"
              onClick={() => onProjectFilterChange('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                selectedProjectId === 'all'
                  ? 'bg-zinc-800 text-white shadow-2xs'
                  : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border border-zinc-200/60'
              }`}
            >
              <span>All Tasks</span>
              {projectCounts && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    selectedProjectId === 'all'
                      ? 'bg-zinc-700 text-zinc-200'
                      : 'bg-zinc-200/70 text-zinc-600'
                  }`}
                >
                  {projectCounts.all}
                </span>
              )}
            </button>

            {/* Unassigned Tasks Pill */}
            <button
              type="button"
              id="project-filter-unassigned"
              onClick={() => onProjectFilterChange('unassigned')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                selectedProjectId === 'unassigned'
                  ? 'bg-zinc-800 text-white shadow-2xs'
                  : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border border-zinc-200/60'
              }`}
            >
              <span>Unassigned</span>
              {projectCounts && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    selectedProjectId === 'unassigned'
                      ? 'bg-zinc-700 text-zinc-200'
                      : 'bg-zinc-200/70 text-zinc-600'
                  }`}
                >
                  {projectCounts.unassigned}
                </span>
              )}
            </button>

            {/* Individual Project Pills (shows first 3 projects) */}
            {projects.slice(0, 3).map((project) => {
              const isSelected = selectedProjectId === project.id;
              const count = projectCounts?.byProject[project.id] ?? 0;
              return (
                <button
                  key={project.id}
                  type="button"
                  id={`project-filter-pill-${project.id}`}
                  onClick={() => onProjectFilterChange(project.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer max-w-[170px] ${
                    isSelected
                      ? 'bg-zinc-800 text-white shadow-2xs'
                      : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border border-zinc-200/60'
                  }`}
                >
                  <span className="truncate">{project.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono shrink-0 ${
                      isSelected
                        ? 'bg-zinc-700 text-zinc-200'
                        : 'bg-zinc-200/70 text-zinc-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Project Dropdown (handles any number of projects & mobile view cleanly) */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
            <label htmlFor="project-filter-select" className="sr-only">
              Filter by project
            </label>
            <div className="relative">
              <select
                id="project-filter-select"
                value={selectedProjectId}
                onChange={(e) => onProjectFilterChange(e.target.value)}
                className="text-xs bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200 rounded-lg px-2.5 py-1 text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-900 cursor-pointer appearance-none pr-7 font-medium shadow-2xs"
              >
                <option value="all">All Projects ({projectCounts?.all ?? 0})</option>
                <option value="unassigned">
                  Unassigned Tasks ({projectCounts?.unassigned ?? 0})
                </option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({projectCounts?.byProject[p.id] ?? 0})
                  </option>
                ))}
              </select>
              <Filter className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
