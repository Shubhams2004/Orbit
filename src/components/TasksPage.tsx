import React, { useState, useMemo } from 'react';
import { Plus, CheckCircle, SearchX, Loader2, AlertCircle, FolderKanban, Check, ArrowRight } from 'lucide-react';
import { TaskSearch } from './TaskSearch';
import { TaskFilters } from './TaskFilters';
import { TaskItem } from './TaskItem';
import { TaskModal } from './TaskModal';
import type { Task, TaskFilter, TaskSortOption, TaskPriority, Project } from '../types';

interface TasksPageProps {
  tasks: Task[];
  projects?: Project[];
  isLoading?: boolean;
  syncError?: string | null;
  onToggleTask: (id: string) => void;
  onAddTask: (taskData: Omit<Task, 'id' | 'completed'>) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onMoveTaskToProject?: (taskId: string, newProjectId: string | null) => void;
  onOpenProjectWorkspace?: (projectId: string) => void;
}

export const TasksPage: React.FC<TasksPageProps> = ({
  tasks,
  projects = [],
  isLoading = false,
  syncError = null,
  onToggleTask,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onMoveTaskToProject,
  onOpenProjectWorkspace,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFilter, setCurrentFilter] = useState<TaskFilter>('all');
  const [currentSort, setCurrentSort] = useState<TaskSortOption>('due_date');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all'); // 'all' | 'unassigned' | projectId
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

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

  // Project ID to Name lookup map
  const projectNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of projects) {
      map[p.id] = p.name;
    }
    return map;
  }, [projects]);

  // Project task counts (All, Unassigned, by Project)
  const projectCounts = useMemo(() => {
    const byProject: Record<string, number> = {};
    for (const p of projects) {
      byProject[p.id] = 0;
    }
    let unassignedCount = 0;
    for (const t of tasks) {
      if (!t.projectId) {
        unassignedCount++;
      } else if (byProject[t.projectId] !== undefined) {
        byProject[t.projectId]++;
      }
    }
    return {
      all: tasks.length,
      unassigned: unassignedCount,
      byProject,
    };
  }, [tasks, projects]);

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        // Project filter (S5.4: Task Organization)
        if (selectedProjectId === 'unassigned') {
          if (task.projectId) return false;
        } else if (selectedProjectId !== 'all') {
          if (task.projectId !== selectedProjectId) return false;
        }

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
  }, [tasks, currentFilter, searchQuery, currentSort, selectedProjectId]);

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
    projectId?: string | null;
  }) => {
    if (editingTask) {
      const prevProj = editingTask.projectId;
      onUpdateTask({
        ...editingTask,
        ...data,
      });

      if (data.projectId !== prevProj) {
        const pName = data.projectId ? projectNameMap[data.projectId] || 'Project' : null;
        if (data.projectId) {
          setFeedbackMessage(`Moved "${data.title}" to ${pName}.`);
        } else {
          setFeedbackMessage(`Unassigned "${data.title}" from project.`);
        }
        setTimeout(() => setFeedbackMessage(null), 3500);
      }
    } else {
      onAddTask(data);
      if (data.projectId) {
        const pName = projectNameMap[data.projectId] || 'Project';
        setFeedbackMessage(`Created task "${data.title}" in ${pName}.`);
        setTimeout(() => setFeedbackMessage(null), 3500);
      }
    }
  };

  const handleMoveTask = (taskId: string, newProjectId: string | null) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    if (onMoveTaskToProject) {
      onMoveTaskToProject(taskId, newProjectId);
    } else {
      onUpdateTask({
        ...targetTask,
        projectId: newProjectId,
      });
    }

    // Doherty Threshold feedback (<400ms)
    if (newProjectId) {
      const pName = projectNameMap[newProjectId] || 'Project';
      setFeedbackMessage(`Assigned "${targetTask.title}" to ${pName}.`);
    } else {
      setFeedbackMessage(`Unassigned "${targetTask.title}" from project.`);
    }
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

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

      {/* Success Feedback Banner (Doherty Threshold) */}
      {feedbackMessage && (
        <div
          id="tasks-feedback-banner"
          role="status"
          className="flex items-center justify-between p-3 text-xs text-emerald-900 bg-emerald-50 border border-emerald-200/80 rounded-xl shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{feedbackMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold px-2 py-0.5 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

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
          selectedProjectId={selectedProjectId}
          onProjectFilterChange={setSelectedProjectId}
          projects={projects}
          projectCounts={projectCounts}
        />
      </div>

      {/* Active Project Filter Context Tag */}
      {selectedProjectId !== 'all' && (
        <div
          id="active-project-filter-indicator"
          className="flex items-center justify-between px-3.5 py-2.5 bg-white border border-zinc-200/80 rounded-xl text-xs text-zinc-700 font-medium shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <FolderKanban className="w-3.5 h-3.5 text-zinc-500" />
            <span>
              Filtered by:{' '}
              <strong className="text-zinc-900">
                {selectedProjectId === 'unassigned'
                  ? 'Unassigned Tasks'
                  : selectedProject?.name || 'Selected Project'}
              </strong>{' '}
              <span className="text-zinc-400">
                ({filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'})
              </span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            {selectedProjectId !== 'unassigned' && selectedProject && onOpenProjectWorkspace && (
              <button
                type="button"
                id="open-filtered-project-workspace-btn"
                onClick={() => onOpenProjectWorkspace(selectedProjectId)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-900 hover:text-zinc-950 underline cursor-pointer"
              >
                <span>Open Project Workspace</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
            <button
              type="button"
              id="clear-project-filter-btn"
              onClick={() => setSelectedProjectId('all')}
              className="text-xs text-zinc-600 hover:text-zinc-900 underline font-medium cursor-pointer"
            >
              Show all tasks
            </button>
          </div>
        </div>
      )}

      {/* Sync Error Notice if any */}
      {syncError && (
        <div
          id="tasks-sync-error-banner"
          className="flex items-center gap-2 p-3 text-xs text-amber-800 bg-amber-50 border border-amber-200/80 rounded-xl"
        >
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{syncError}</span>
        </div>
      )}

      {/* Task List */}
      <div id="tasks-list-container" className="space-y-2.5">
        {isLoading && tasks.length === 0 ? (
          <div
            id="tasks-loading-skeleton"
            className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-zinc-200/80 text-zinc-500"
          >
            <Loader2 className="w-6 h-6 animate-spin text-zinc-600 mb-2" />
            <p className="text-sm font-medium">Syncing tasks from Supabase...</p>
          </div>
        ) : filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              projectName={task.projectId ? projectNameMap[task.projectId] : undefined}
              projects={projects}
              onToggle={onToggleTask}
              onEdit={handleOpenEditModal}
              onDelete={onDeleteTask}
              onMoveToProject={handleMoveTask}
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
              ) : selectedProjectId !== 'all' ? (
                <FolderKanban className="w-6 h-6" />
              ) : (
                <CheckCircle className="w-6 h-6" />
              )}
            </div>
            <h3 className="text-base font-semibold text-zinc-900">
              {searchQuery
                ? 'No matching tasks'
                : selectedProjectId === 'unassigned'
                ? 'No unassigned tasks'
                : selectedProjectId !== 'all' && selectedProject
                ? `No tasks in ${selectedProject.name}`
                : 'No tasks here'}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 max-w-sm mx-auto mt-1.5 leading-relaxed">
              {searchQuery
                ? `No tasks match your search "${searchQuery}". Try a different keyword or clear your search.`
                : selectedProjectId === 'unassigned'
                ? 'All of your tasks are currently organized into projects.'
                : selectedProjectId !== 'all' && selectedProject
                ? `Tasks assigned to "${selectedProject.name}" will appear here. Add a new task or assign existing tasks.`
                : currentFilter === 'completed'
                ? 'You have not completed any tasks yet. Keep going!'
                : 'There are no tasks in this view. Use the button below to add your next item.'}
            </p>

            <div className="mt-5 flex items-center justify-center gap-3 flex-wrap">
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
              {selectedProjectId !== 'all' && (
                <button
                  type="button"
                  id="empty-state-view-all-btn"
                  onClick={() => setSelectedProjectId('all')}
                  className="px-3.5 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
                >
                  View all tasks
                </button>
              )}
              <button
                type="button"
                id="empty-state-add-task-btn"
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>
                  {selectedProjectId !== 'all' && selectedProjectId !== 'unassigned' && selectedProject
                    ? `Add task to ${selectedProject.name}`
                    : 'Add a task'}
                </span>
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
        projects={projects}
        defaultProjectId={selectedProjectId}
      />
    </div>
  );
};
