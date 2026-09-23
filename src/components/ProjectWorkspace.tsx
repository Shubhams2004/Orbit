import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  FolderKanban,
  CheckCircle2,
  PlayCircle,
  Archive,
  ArrowUpRight,
  Search,
  SearchX,
  Check,
  AlertCircle,
  Calendar,
  Clock,
  User,
  AlertTriangle,
  Layers,
  Circle,
  SlidersHorizontal,
} from 'lucide-react';
import { TaskItem } from './TaskItem';
import { TaskModal } from './TaskModal';
import { ProjectModal } from './ProjectModal';
import type {
  Project,
  ProjectPriority,
  ProjectStatus,
  Task,
  TaskPriority,
  UserProfile,
} from '../types';

interface ProjectWorkspaceProps {
  project: Project;
  allProjects: Project[];
  tasks: Task[];
  currentUser?: UserProfile;
  isLoading?: boolean;
  syncError?: string | null;
  onBackToProjects: () => void;
  onNavigateToTasks: () => void;
  onUpdateProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  onToggleTask: (id: string) => void;
  onAddTask: (taskData: Omit<Task, 'id' | 'completed'>) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onMoveTaskToProject?: (taskId: string, newProjectId: string | null) => void;
}

type WorkspaceTaskFilter = 'all' | 'pending' | 'completed';
type WorkspaceTaskSort = 'due_date' | 'priority' | 'title';

export const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({
  project,
  allProjects,
  tasks,
  currentUser,
  isLoading = false,
  syncError = null,
  onBackToProjects,
  onNavigateToTasks,
  onUpdateProject,
  onDeleteProject,
  onToggleTask,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onMoveTaskToProject,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [taskFilter, setTaskFilter] = useState<WorkspaceTaskFilter>('all');
  const [taskSort, setTaskSort] = useState<WorkspaceTaskSort>('due_date');

  // Inline Quick Add Task state
  const [quickTitle, setQuickTitle] = useState('');

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Success Feedback Message (Doherty Threshold)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Lookup map for project names
  const projectNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of allProjects) {
      map[p.id] = p.name;
    }
    return map;
  }, [allProjects]);

  // Tasks scoped to this project
  const projectTasks = useMemo(() => {
    return tasks.filter((t) => t.projectId === project.id);
  }, [tasks, project.id]);

  // Metrics & Progress calculation (Zeigarnik Effect & Von Restorff Effect)
  const metrics = useMemo(() => {
    const total = projectTasks.length;
    const completed = projectTasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    const highPriority = projectTasks.filter((t) => !t.completed && t.priority === 'High priority').length;
    const mediumPriority = projectTasks.filter((t) => !t.completed && t.priority === 'Medium priority').length;
    const lowPriority = projectTasks.filter((t) => !t.completed && t.priority === 'Low priority').length;

    return {
      total,
      completed,
      pending,
      progressPercent,
      highPriority,
      mediumPriority,
      lowPriority,
    };
  }, [projectTasks]);

  // Filtered and sorted tasks
  const filteredTasks = useMemo(() => {
    return projectTasks
      .filter((task) => {
        // Status filter
        if (taskFilter === 'pending' && task.completed) return false;
        if (taskFilter === 'completed' && !task.completed) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = (task.title || '').toLowerCase().includes(q);
          const matchDesc = (task.description || '').toLowerCase().includes(q);
          const matchCat = (task.category || '').toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchCat) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (taskSort === 'priority') {
          const score = (p: TaskPriority) => {
            if (p === 'High priority') return 3;
            if (p === 'Medium priority') return 2;
            return 1;
          };
          return score(b.priority) - score(a.priority);
        }

        if (taskSort === 'title') {
          return (a.title || '').localeCompare(b.title || '');
        }

        // Default: due_date
        const isAToday = (a.dueDate || '').toLowerCase().includes('today');
        const isBToday = (b.dueDate || '').toLowerCase().includes('today');
        if (isAToday && !isBToday) return -1;
        if (!isAToday && isBToday) return 1;
        return (a.time || '').localeCompare(b.time || '');
      });
  }, [projectTasks, taskFilter, searchQuery, taskSort]);

  // Format timestamps
  const formattedCreatedDate = useMemo(() => {
    if (!project.createdAt) return '';
    try {
      const d = new Date(project.createdAt);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  }, [project.createdAt]);

  const formattedUpdatedDate = useMemo(() => {
    if (!project.updatedAt) return '';
    try {
      const d = new Date(project.updatedAt);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  }, [project.updatedAt]);

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 3800);
  };

  // Quick task creation
  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickTitle.trim();
    if (!trimmed) return;

    onAddTask({
      title: trimmed,
      description: '',
      projectId: project.id,
      dueDate: 'Today',
      time: '12:00 PM',
      priority: 'Medium priority',
      category: 'Project',
    });

    setQuickTitle('');
    showFeedback(`Added "${trimmed}" to ${project.name}.`);
  };

  // Modal handlers
  const handleOpenCreateTaskModal = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTaskModal = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleSaveTaskModal = (data: {
    title: string;
    description: string;
    dueDate: string;
    time: string;
    priority: TaskPriority;
    category: string;
    projectId?: string | null;
  }) => {
    if (editingTask) {
      onUpdateTask({
        ...editingTask,
        ...data,
      });
      if (data.projectId !== project.id) {
        const otherName = data.projectId ? projectNameMap[data.projectId] || 'Project' : 'Unassigned';
        showFeedback(`Moved "${data.title}" to ${otherName}.`);
      } else {
        showFeedback(`Updated task "${data.title}".`);
      }
    } else {
      onAddTask(data);
      showFeedback(`Created task "${data.title}" in ${project.name}.`);
    }
  };

  const handleMoveTask = (taskId: string, newProjectId: string | null) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;

    if (onMoveTaskToProject) {
      onMoveTaskToProject(taskId, newProjectId);
    } else {
      onUpdateTask({
        ...target,
        projectId: newProjectId,
      });
    }

    if (newProjectId && newProjectId !== project.id) {
      const destName = projectNameMap[newProjectId] || 'another project';
      showFeedback(`Moved "${target.title}" to ${destName}.`);
    } else if (!newProjectId) {
      showFeedback(`Removed "${target.title}" from ${project.name}.`);
    }
  };

  const handleQuickStatusChange = (newStatus: ProjectStatus) => {
    onUpdateProject({
      ...project,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
    showFeedback(`Project status updated to ${newStatus}.`);
  };

  const handleQuickPriorityChange = (newPriority: ProjectPriority) => {
    onUpdateProject({
      ...project,
      priority: newPriority,
      updatedAt: new Date().toISOString(),
    });
    showFeedback(`Project priority updated to ${newPriority}.`);
  };

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'active':
        return (
          <span
            id="workspace-status-badge"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60"
          >
            <PlayCircle className="w-3.5 h-3.5 text-emerald-600" />
            Active
          </span>
        );
      case 'completed':
        return (
          <span
            id="workspace-status-badge"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/60"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            Completed
          </span>
        );
      case 'archived':
        return (
          <span
            id="workspace-status-badge"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-100 text-zinc-600 border border-zinc-200/60"
          >
            <Archive className="w-3.5 h-3.5 text-zinc-500" />
            Archived
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: ProjectPriority) => {
    switch (priority) {
      case 'high':
        return (
          <span
            id="workspace-priority-badge"
            className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200/60"
          >
            High priority
          </span>
        );
      case 'medium':
        return (
          <span
            id="workspace-priority-badge"
            className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/60"
          >
            Medium priority
          </span>
        );
      case 'low':
      default:
        return (
          <span
            id="workspace-priority-badge"
            className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-100 text-zinc-600 border border-zinc-200/60"
          >
            Low priority
          </span>
        );
    }
  };

  return (
    <div
      id="project-workspace"
      className="w-full max-w-5xl mx-auto py-6 sm:py-10 px-4 sm:px-6 space-y-6 sm:space-y-8"
    >
      {/* Top Navigation & Breadcrumbs Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-200/70">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-500 font-medium">
          <button
            type="button"
            id="workspace-back-btn"
            onClick={onBackToProjects}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
            aria-label="Back to project list"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Projects</span>
          </button>
          <span className="text-zinc-300">/</span>
          <span className="text-zinc-900 font-semibold truncate max-w-xs sm:max-w-md">
            {project.name}
          </span>
        </div>

        {/* Global navigation shortcuts */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            id="workspace-view-all-tasks-btn"
            onClick={onNavigateToTasks}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
            title="Go to all workspace tasks"
          >
            <span>All Tasks</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            id="workspace-edit-project-btn"
            onClick={() => setIsProjectModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer border border-zinc-200/70"
            title="Edit project details"
          >
            <Pencil className="w-3.5 h-3.5 text-zinc-500" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            id="workspace-delete-project-btn"
            onClick={() => setIsConfirmingDelete(true)}
            className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-200"
            title="Delete project"
            aria-label="Delete project"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Success Feedback Banner (Doherty Threshold) */}
      {feedbackMessage && (
        <div
          id="workspace-feedback-banner"
          role="status"
          className="flex items-center justify-between p-3.5 text-xs text-emerald-950 bg-emerald-50 border border-emerald-200/80 rounded-xl shadow-2xs animate-fade-in"
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

      {/* Sync Error Banner if any */}
      {syncError && (
        <div
          id="workspace-sync-error-banner"
          className="flex items-center gap-2 p-3 text-xs text-amber-900 bg-amber-50 border border-amber-200/80 rounded-xl"
        >
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{syncError}</span>
        </div>
      )}

      {/* Section 1: Project Overview Card (Miller's Law Chunking & Fitts's Law) */}
      <div
        id="workspace-project-overview"
        className="bg-white border border-zinc-200/80 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5"
      >
        {/* Status, Priority & Quick Selectors */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 flex-wrap">
            {getStatusBadge(project.status)}
            {getPriorityBadge(project.priority)}
            <span
              id="workspace-task-count-chip"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-100 text-zinc-700 border border-zinc-200/60"
            >
              <FolderKanban className="w-3.5 h-3.5 text-zinc-500" />
              <span>
                {metrics.total} {metrics.total === 1 ? 'task' : 'tasks'}
              </span>
            </span>
          </div>

          {/* Quick status & priority controls */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center gap-1">
              <label htmlFor="workspace-status-select" className="sr-only">
                Change project status
              </label>
              <select
                id="workspace-status-select"
                value={project.status}
                onChange={(e) => handleQuickStatusChange(e.target.value as ProjectStatus)}
                className="text-xs bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-900 cursor-pointer transition-colors"
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <label htmlFor="workspace-priority-select" className="sr-only">
                Change project priority
              </label>
              <select
                id="workspace-priority-select"
                value={project.priority}
                onChange={(e) => handleQuickPriorityChange(e.target.value as ProjectPriority)}
                className="text-xs bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-900 cursor-pointer transition-colors"
              >
                <option value="low">Low priority</option>
                <option value="medium">Medium priority</option>
                <option value="high">High priority</option>
              </select>
            </div>
          </div>
        </div>

        {/* Name & Description */}
        <div>
          <h1
            id="workspace-project-title"
            className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight"
          >
            {project.name}
          </h1>
          {project.description ? (
            <p
              id="workspace-project-description"
              className="mt-2 text-sm sm:text-base text-zinc-600 leading-relaxed max-w-3xl"
            >
              {project.description}
            </p>
          ) : (
            <p className="mt-1 text-xs text-zinc-400 italic">
              No description provided. Click Edit to add notes or scope.
            </p>
          )}
        </div>

        {/* Metadata Footer (Unboxed Clean Typography - Frontend Design Skill) */}
        <div
          id="workspace-metadata"
          className="pt-4 border-t border-zinc-100 flex items-center gap-3 text-xs text-zinc-500 flex-wrap"
        >
          <span className="inline-flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-zinc-400" />
            <span>{currentUser?.email || 'Alex (Personal Workspace)'}</span>
          </span>
          {formattedCreatedDate && (
            <>
              <span className="text-zinc-300" aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <span>Created {formattedCreatedDate}</span>
              </span>
            </>
          )}
          {formattedUpdatedDate && formattedUpdatedDate !== formattedCreatedDate && (
            <>
              <span className="text-zinc-300" aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span>Updated {formattedUpdatedDate}</span>
              </span>
            </>
          )}
        </div>
      </div>

      {/* Section 2: Progress & Work Visibility (Zeigarnik Effect & Von Restorff Effect) */}
      <div
        id="workspace-progress-card"
        className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 tracking-tight">
              Project Progress
            </h2>
            {/* Zeigarnik Effect: Highlights remaining unfinished tasks clearly */}
            <p
              id="workspace-zeigarnik-summary"
              className="text-xs text-zinc-500 mt-0.5"
            >
              {metrics.total === 0
                ? 'No tasks yet. Add tasks below to start tracking momentum.'
                : metrics.pending === 0
                ? '🎉 All tasks completed in this project! Ready to review or archive.'
                : `${metrics.pending} incomplete ${
                    metrics.pending === 1 ? 'task' : 'tasks'
                  } remaining to finish.`}
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold text-zinc-900 self-start sm:self-auto">
            <span id="workspace-progress-percent" className="text-lg">
              {metrics.progressPercent}%
            </span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-zinc-100 rounded-full h-2.5 overflow-hidden">
          <div
            id="workspace-progress-bar-fill"
            role="progressbar"
            aria-valuenow={metrics.progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-full bg-emerald-600 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${metrics.progressPercent}%` }}
          />
        </div>

        {/* Task metric counters */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="p-3 bg-zinc-50/70 border border-zinc-200/50 rounded-xl">
            <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider block">
              Total
            </span>
            <span
              id="workspace-metric-total"
              className="text-base font-semibold text-zinc-900 mt-0.5 block"
            >
              {metrics.total}
            </span>
          </div>
          <div className="p-3 bg-emerald-50/50 border border-emerald-200/40 rounded-xl">
            <span className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider block">
              Completed
            </span>
            <span
              id="workspace-metric-completed"
              className="text-base font-semibold text-emerald-800 mt-0.5 block"
            >
              {metrics.completed}
            </span>
          </div>
          <div className="p-3 bg-amber-50/50 border border-amber-200/40 rounded-xl">
            <span className="text-[11px] font-medium text-amber-700 uppercase tracking-wider block">
              Incomplete
            </span>
            <span
              id="workspace-metric-pending"
              className="text-base font-semibold text-amber-800 mt-0.5 block"
            >
              {metrics.pending}
            </span>
          </div>
        </div>
      </div>

      {/* Section 3: Project Task Management (Fitts's Law & Hick's Law) */}
      <div id="workspace-tasks-section" className="space-y-4">
        {/* Actions & Filters Bar */}
        <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-2xs space-y-3.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                id="workspace-task-search-input"
                placeholder={`Search tasks in ${project.name}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-zinc-50 hover:bg-zinc-100/80 focus:bg-white border border-zinc-200/80 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-colors"
              />
            </div>

            {/* Primary Action: Add Task button (Von Restorff Effect & Fitts's Law) */}
            <button
              type="button"
              id="workspace-add-task-btn"
              onClick={handleOpenCreateTaskModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs sm:text-sm font-medium transition-colors shadow-xs cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add task to project</span>
            </button>
          </div>

          {/* Filter Tabs & Sort Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1 border-t border-zinc-100">
            {/* Segmented Filter Controls */}
            <div className="flex items-center gap-1 p-1 bg-zinc-100/80 rounded-xl">
              <button
                type="button"
                id="workspace-filter-all"
                onClick={() => setTaskFilter('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  taskFilter === 'all'
                    ? 'bg-white text-zinc-900 shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                All ({projectTasks.length})
              </button>
              <button
                type="button"
                id="workspace-filter-pending"
                onClick={() => setTaskFilter('pending')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  taskFilter === 'pending'
                    ? 'bg-white text-zinc-900 shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                To Do ({metrics.pending})
              </button>
              <button
                type="button"
                id="workspace-filter-completed"
                onClick={() => setTaskFilter('completed')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  taskFilter === 'completed'
                    ? 'bg-white text-zinc-900 shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Completed ({metrics.completed})
              </button>
            </div>

            {/* Sort selector */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-xs text-zinc-400">Sort:</span>
              <select
                id="workspace-task-sort-select"
                value={taskSort}
                onChange={(e) => setTaskSort(e.target.value as WorkspaceTaskSort)}
                className="text-xs bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1 text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-900 cursor-pointer"
              >
                <option value="due_date">Due date</option>
                <option value="priority">Priority</option>
                <option value="title">Title</option>
              </select>
            </div>
          </div>

          {/* Inline Quick-Add Task Input (1-click, Doherty Threshold) */}
          <form
            id="workspace-quick-add-form"
            onSubmit={handleQuickAddSubmit}
            className="flex items-center gap-2 pt-2 border-t border-zinc-100"
          >
            <input
              type="text"
              id="workspace-quick-add-input"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder={`+ Quick add task to ${project.name} (press Enter)...`}
              className="flex-1 px-3 py-1.5 text-xs bg-zinc-50/80 hover:bg-zinc-100/70 focus:bg-white border border-zinc-200/70 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-colors"
            />
            <button
              type="submit"
              id="workspace-quick-add-submit-btn"
              disabled={!quickTitle.trim()}
              className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-40 text-zinc-800 text-xs font-medium rounded-lg transition-colors cursor-pointer shrink-0 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </form>
        </div>

        {/* Task List */}
        <div id="workspace-tasks-list" className="space-y-2.5">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                projectName={project.name}
                projects={allProjects}
                onToggle={onToggleTask}
                onEdit={handleOpenEditTaskModal}
                onDelete={onDeleteTask}
                onMoveToProject={handleMoveTask}
              />
            ))
          ) : (
            /* Contextual Empty State */
            <div
              id="workspace-tasks-empty-state"
              className="text-center py-12 px-4 bg-white border border-dashed border-zinc-300/80 rounded-2xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center mx-auto text-zinc-400 mb-3.5">
                {searchQuery ? (
                  <SearchX className="w-6 h-6" />
                ) : (
                  <FolderKanban className="w-6 h-6" />
                )}
              </div>
              <h3 className="text-base font-semibold text-zinc-900">
                {searchQuery
                  ? 'No matching tasks in this project'
                  : taskFilter === 'completed'
                  ? 'No completed tasks yet'
                  : taskFilter === 'pending' && metrics.total > 0
                  ? 'No pending tasks left!'
                  : `No tasks in ${project.name}`}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 max-w-sm mx-auto mt-1.5 leading-relaxed">
                {searchQuery
                  ? `No tasks match your search "${searchQuery}". Clear your search or add a new task.`
                  : taskFilter === 'completed'
                  ? 'Complete tasks by checking their circles to see them here.'
                  : taskFilter === 'pending' && metrics.total > 0
                  ? 'Great job! All tasks in this project are currently completed.'
                  : `Create tasks for ${project.name} to track milestones, tasks, and deadlines.`}
              </p>

              <div className="mt-5 flex items-center justify-center gap-3 flex-wrap">
                {searchQuery && (
                  <button
                    type="button"
                    id="workspace-clear-search-btn"
                    onClick={() => setSearchQuery('')}
                    className="px-3.5 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Clear search
                  </button>
                )}
                {taskFilter !== 'all' && (
                  <button
                    type="button"
                    id="workspace-reset-filter-btn"
                    onClick={() => setTaskFilter('all')}
                    className="px-3.5 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Show all project tasks
                  </button>
                )}
                <button
                  type="button"
                  id="workspace-empty-add-task-btn"
                  onClick={handleOpenCreateTaskModal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add a task</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task Modal (Create & Edit Task scoped to this project) */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTaskModal}
        initialTask={editingTask}
        projects={allProjects}
        defaultProjectId={project.id}
      />

      {/* Project Modal (Edit Project details) */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSave={(data) => {
          onUpdateProject({
            ...project,
            name: data.name,
            description: data.description,
            status: data.status,
            priority: data.priority,
            updatedAt: new Date().toISOString(),
          });
          setIsProjectModalOpen(false);
          showFeedback(`Saved changes to ${data.name}.`);
        }}
        initialProject={project}
        currentUser={currentUser}
      />

      {/* Delete Project Confirmation Overlay (Tesler's Law) */}
      {isConfirmingDelete && (
        <div
          id="workspace-delete-confirm-overlay"
          className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in"
        >
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-700 font-semibold text-base">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>Delete project?</span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
              Are you sure you want to delete{' '}
              <strong className="text-zinc-900 font-semibold">{project.name}</strong>?
            </p>
            <p className="text-xs text-zinc-500 bg-zinc-50 p-3 rounded-xl border border-zinc-200/70">
              All tasks currently in this project ({projectTasks.length}{' '}
              {projectTasks.length === 1 ? 'task' : 'tasks'}) will remain safely
              preserved in your workspace and become unassigned.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                id="workspace-cancel-delete-btn"
                onClick={() => setIsConfirmingDelete(false)}
                className="px-4 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="workspace-confirm-delete-btn"
                onClick={() => {
                  setIsConfirmingDelete(false);
                  onDeleteProject(project.id);
                  onBackToProjects();
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Delete project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
