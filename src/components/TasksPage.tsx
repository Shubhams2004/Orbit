import React, { useState, useMemo } from 'react';
import { Plus, CheckCircle, SearchX, Loader2, AlertCircle } from 'lucide-react';
import { TaskSearch } from './TaskSearch';
import { TaskFilters } from './TaskFilters';
import { TaskItem } from './TaskItem';
import { TaskModal } from './TaskModal';
import type { Task, TaskFilter, TaskSortOption, TaskPriority } from '../types';

interface TasksPageProps {
  tasks: Task[];
  isLoading?: boolean;
  syncError?: string | null;
  onToggleTask: (id: string) => void;
  onAddTask: (taskData: Omit<Task, 'id' | 'completed'>) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}

export const TasksPage: React.FC<TasksPageProps> = ({
  tasks,
  isLoading = false,
  syncError = null,
  onToggleTask,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFilter, setCurrentFilter] = useState<TaskFilter>('all');
  const [currentSort, setCurrentSort] = useState<TaskSortOption>('due_date');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Filter counts
  const counts = useMemo(() => {
    return {
      all: tasks.length,
      today: tasks.filter((t) => (t.dueDate || '').toLowerCase().includes('today')).length,
      upcoming: tasks.filter(
        (t) =>
          !t.completed &&
          ((t.dueDate || '').toLowerCase().includes('tomorrow') ||
            !(t.dueDate || '').toLowerCase().includes('today'))
      ).length,
      completed: tasks.filter((t) => t.completed).length,
    };
  }, [tasks]);

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        const taskDue = (task.dueDate || '').toLowerCase();
        // Tab filter
        if (currentFilter === 'today') {
          if (!taskDue.includes('today')) return false;
        } else if (currentFilter === 'upcoming') {
          const isUpcoming =
            !task.completed &&
            (taskDue.includes('tomorrow') || !taskDue.includes('today'));
          if (!isUpcoming) return false;
        } else if (currentFilter === 'completed') {
          if (!task.completed) return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          const matchesTitle = (task.title || '').toLowerCase().includes(query);
          const matchesCategory = (task.category || '').toLowerCase().includes(query);
          const matchesDesc = (task.description || '').toLowerCase().includes(query);
          if (!matchesTitle && !matchesCategory && !matchesDesc) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (currentSort === 'priority') {
          const priorityScore = (p: TaskPriority) => {
            if (p === 'High priority') return 3;
            if (p === 'Medium priority') return 2;
            return 1;
          };
          return priorityScore(b.priority) - priorityScore(a.priority);
        }

        if (currentSort === 'title') {
          return (a.title || '').localeCompare(b.title || '');
        }

        // Default: due_date
        const isAToday = (a.dueDate || '').toLowerCase().includes('today');
        const isBToday = (b.dueDate || '').toLowerCase().includes('today');
        if (isAToday && !isBToday) return -1;
        if (!isAToday && isBToday) return 1;
        return (a.time || '').localeCompare(b.time || '');
      });
  }, [tasks, currentFilter, searchQuery, currentSort]);

  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleSaveModal = (data: {
    title: string;
    description: string;
    dueDate: string;
    time: string;
    priority: TaskPriority;
    category: string;
  }) => {
    if (editingTask) {
      onUpdateTask({
        ...editingTask,
        ...data,
      });
    } else {
      onAddTask(data);
    }
  };

  return (
    <div
      id="tasks-page"
      className="w-full max-w-4xl mx-auto py-6 sm:py-10 px-4 sm:px-6 space-y-6 sm:space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            id="tasks-page-heading"
            className="text-2xl sm:text-3xl font-semibold text-zinc-900 tracking-tight"
          >
            Tasks
          </h1>
          <p
            id="tasks-page-subtitle"
            className="mt-1 text-sm sm:text-base text-zinc-500 font-normal"
          >
            Organize everything you need to get done.
          </p>
        </div>

        {/* Add task button */}
        <button
          type="button"
          id="add-task-btn"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium transition-colors shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add task</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="space-y-3.5 bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <TaskSearch value={searchQuery} onChange={setSearchQuery} />
        </div>

        <TaskFilters
          currentFilter={currentFilter}
          onFilterChange={setCurrentFilter}
          currentSort={currentSort}
          onSortChange={setCurrentSort}
          counts={counts}
        />
      </div>

      {/* Sync Error Notice if any */}
      {syncError && (
        <div className="flex items-center gap-2 p-3 text-xs text-amber-800 bg-amber-50 border border-amber-200/80 rounded-xl">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{syncError}</span>
        </div>
      )}

      {/* Task List */}
      <div id="tasks-list-container" className="space-y-2.5">
        {isLoading && tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-zinc-200/80 text-zinc-500">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-600 mb-2" />
            <p className="text-sm font-medium">Syncing tasks from Supabase...</p>
          </div>
        ) : filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={onToggleTask}
              onEdit={handleOpenEditModal}
              onDelete={onDeleteTask}
            />
          ))
        ) : (
          /* Empty state */
          <div
            id="tasks-empty-state"
            className="text-center py-12 px-4 bg-white border border-dashed border-zinc-300/80 rounded-2xl"
          >
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center mx-auto text-zinc-400 mb-3.5">
              {searchQuery ? (
                <SearchX className="w-6 h-6" />
              ) : (
                <CheckCircle className="w-6 h-6" />
              )}
            </div>
            <h3 className="text-base font-semibold text-zinc-900">
              No tasks here
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 max-w-sm mx-auto mt-1.5 leading-relaxed">
              {searchQuery
                ? `No tasks match your search "${searchQuery}". Try a different keyword or clear your search.`
                : currentFilter === 'completed'
                ? 'You have not completed any tasks yet. Keep going!'
                : 'There are no tasks in this view. Use the button below to add your next item.'}
            </p>

            <div className="mt-5 flex items-center justify-center gap-3">
              {searchQuery && (
                <button
                  type="button"
                  id="clear-search-btn"
                  onClick={() => setSearchQuery('')}
                  className="px-3.5 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
                >
                  Clear search
                </button>
              )}
              <button
                type="button"
                id="empty-state-add-task-btn"
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add a task</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Task Modal (Create & Edit) */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModal}
        initialTask={editingTask}
      />
    </div>
  );
};
