import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Search,
  FolderKanban,
  AlertCircle,
  SearchX,
  CheckCircle,
  X,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { ProjectItem } from './ProjectItem';
import { ProjectModal } from './ProjectModal';
import type {
  Project,
  ProjectPriority,
  ProjectStatus,
  Task,
  UserProfile,
} from '../types';

interface ProjectsPageProps {
  projects: Project[];
  tasks?: Task[];
  currentUser?: UserProfile;
  isLoading?: boolean;
  syncError?: string | null;
  onCreateProject: (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  onSelectProject?: (project: Project) => void;
}

type ProjectFilter = 'all' | 'active' | 'completed' | 'archived';
type PriorityFilter = 'all' | 'high' | 'medium' | 'low';
type ProjectSort = 'created_at_desc' | 'created_at_asc' | 'name_asc' | 'priority_desc';

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
  projects,
  tasks = [],
  currentUser,
  isLoading = false,
  syncError = null,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  onSelectProject,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFilter, setCurrentFilter] = useState<ProjectFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [currentSort, setCurrentSort] = useState<ProjectSort>('created_at_desc');

  // Success Feedback State (Doherty Threshold: immediate clear acknowledgment)
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Auto-dismiss success notification after 4.5 seconds
  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => {
      setSuccessMessage(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [successMessage]);

  // Filter counts
  const counts = useMemo(() => {
    return {
      all: projects.length,
      active: projects.filter((p) => p.status === 'active').length,
      completed: projects.filter((p) => p.status === 'completed').length,
      archived: projects.filter((p) => p.status === 'archived').length,
    };
  }, [projects]);

  // Task count map by project_id
  const taskCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const task of tasks) {
      if (task.projectId) {
        map[task.projectId] = (map[task.projectId] || 0) + 1;
      }
    }
    return map;
  }, [tasks]);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    return projects
      .filter((project) => {
        // Status filter tab
        if (currentFilter !== 'all' && project.status !== currentFilter) {
          return false;
        }

        // Priority filter
        if (priorityFilter !== 'all' && project.priority !== priorityFilter) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          const matchName = (project.name || '').toLowerCase().includes(query);
          const matchDesc = (project.description || '').toLowerCase().includes(query);
          if (!matchName && !matchDesc) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (currentSort === 'name_asc') {
          return a.name.localeCompare(b.name);
        }
        if (currentSort === 'priority_desc') {
          const weight: Record<ProjectPriority, number> = { high: 3, medium: 2, low: 1 };
          return weight[b.priority] - weight[a.priority];
        }
        if (currentSort === 'created_at_asc') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        // Default: created_at_desc
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [projects, currentFilter, priorityFilter, searchQuery, currentSort]);

  const handleOpenCreateModal = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (project: Project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleSaveModal = (data: {
    name: string;
    description: string;
    status: ProjectStatus;
    priority: ProjectPriority;
  }) => {
    if (editingProject) {
      onUpdateProject({
        ...editingProject,
        name: data.name,
        description: data.description,
        status: data.status,
        priority: data.priority,
        updatedAt: new Date().toISOString(),
      });
      setSuccessMessage(`Project "${data.name}" updated successfully.`);
    } else {
      onCreateProject({
        name: data.name,
        description: data.description,
        status: data.status,
        priority: data.priority,
      });
      setSuccessMessage(`Project "${data.name}" created successfully.`);
    }
  };

  const handleQuickStatusChange = (project: Project, newStatus: ProjectStatus) => {
    onUpdateProject({
      ...project,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
    setSuccessMessage(`Moved "${project.name}" to ${newStatus}.`);
  };

  const handleQuickPriorityChange = (project: Project, newPriority: ProjectPriority) => {
    onUpdateProject({
      ...project,
      priority: newPriority,
      updatedAt: new Date().toISOString(),
    });
    setSuccessMessage(`Updated "${project.name}" priority to ${newPriority}.`);
  };

  const handleDeleteWithFeedback = (id: string) => {
    const projectToDelete = projects.find((p) => p.id === id);
    const projectName = projectToDelete ? projectToDelete.name : 'Project';
    onDeleteProject(id);
    setSuccessMessage(`Deleted "${projectName}". Associated tasks were preserved.`);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setCurrentFilter('all');
    setPriorityFilter('all');
    setCurrentSort('created_at_desc');
  };

  const ownerLabel = currentUser?.name
    ? `${currentUser.name} (${currentUser.role || 'Personal Workspace'})`
    : 'Alex (Personal Workspace)';

  return (
    <div id="projects-page-container" className="w-full max-w-5xl space-y-6">
      {/* Header Section (Jakob's Law & Fitts's Law) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1
              id="projects-page-heading"
              className="text-2xl sm:text-3xl font-semibold text-zinc-900 tracking-tight"
            >
              Projects
            </h1>
            <span
              id="projects-total-pill"
              className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200"
            >
              {projects.length}
            </span>
          </div>
          <p
            id="projects-page-subtitle"
            className="text-xs sm:text-sm text-zinc-500 mt-1"
          >
            Manage bodies of work, track status, and coordinate outcomes across your workspace.
          </p>
        </div>

        {/* Primary Action Button (Fitts's Law: Prominent, easy-to-hit CTA) */}
        <button
          type="button"
          id="add-project-btn"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs sm:text-sm font-medium rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New project</span>
        </button>
      </div>

      {/* Success Notification Banner (Doherty Threshold feedback) */}
      {successMessage && (
        <div
          id="projects-success-banner"
          role="status"
          aria-live="polite"
          className="p-3.5 bg-emerald-50 border border-emerald-200/90 rounded-xl text-xs text-emerald-800 flex items-center justify-between gap-2.5 animate-fade-in shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
          <button
            type="button"
            id="dismiss-success-banner-btn"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1 rounded-md hover:bg-emerald-100 transition-colors cursor-pointer"
            aria-label="Dismiss message"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Persistence / Error State Notice */}
      {syncError && (
        <div
          id="projects-sync-error-banner"
          role="alert"
          className="p-3.5 bg-amber-50 border border-amber-200/90 rounded-xl text-xs text-amber-800 flex items-start gap-2.5 animate-fade-in shadow-2xs"
        >
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">
            <span className="font-semibold">Persistence Notice:</span> {syncError}
          </div>
        </div>
      )}

      {/* Filter, Search & Sort Control Bar (Miller's Law & Hick's Law) */}
      <div className="bg-white p-3.5 sm:p-4 border border-zinc-200/80 rounded-2xl shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs with Badge Counts */}
          <div
            id="project-status-tabs"
            className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0"
          >
            {(['all', 'active', 'completed', 'archived'] as ProjectFilter[]).map((tab) => {
              const isActive = currentFilter === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  id={`project-filter-${tab}`}
                  onClick={() => setCurrentFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-zinc-900 text-white shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  <span>{tab}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-100 text-zinc-500'
                    }`}
                  >
                    {counts[tab]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search, Priority Filter, and Sort Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[180px] sm:w-52">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                id="search-projects-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 focus:bg-white text-zinc-900 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5 rounded cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-1">
              <label htmlFor="priority-filter-select" className="sr-only">
                Filter by priority
              </label>
              <div className="relative">
                <select
                  id="priority-filter-select"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
                  className="text-xs bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-900 cursor-pointer appearance-none pr-7"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
                <Filter className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              </div>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1">
              <label htmlFor="sort-projects-select" className="sr-only">
                Sort projects
              </label>
              <div className="relative">
                <select
                  id="sort-projects-select"
                  value={currentSort}
                  onChange={(e) => setCurrentSort(e.target.value as ProjectSort)}
                  className="text-xs bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-900 cursor-pointer appearance-none pr-7"
                >
                  <option value="created_at_desc">Sort: Newest</option>
                  <option value="created_at_asc">Sort: Oldest</option>
                  <option value="name_asc">Sort: Name (A-Z)</option>
                  <option value="priority_desc">Sort: Priority</option>
                </select>
                <ArrowUpDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Loading Skeletons, Empty States, or Project Cards */}
      {isLoading ? (
        /* Loading Skeleton State */
        <div
          id="projects-loading-skeleton"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4.5"
        >
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white border border-zinc-200/70 rounded-xl p-5 shadow-xs space-y-4 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-16 h-5 bg-zinc-200 rounded-md" />
                  <div className="w-20 h-5 bg-zinc-100 rounded-md" />
                </div>
                <div className="w-8 h-5 bg-zinc-100 rounded-md" />
              </div>
              <div className="space-y-2">
                <div className="w-3/4 h-5 bg-zinc-200 rounded-md" />
                <div className="w-full h-3 bg-zinc-100 rounded-md" />
                <div className="w-2/3 h-3 bg-zinc-100 rounded-md" />
              </div>
              <div className="pt-3 border-t border-zinc-100 flex justify-between items-center">
                <div className="w-20 h-4 bg-zinc-100 rounded-md" />
                <div className="w-24 h-6 bg-zinc-100 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        /* Empty States (Global Empty, Filter Empty, Search Empty) */
        <div
          id="projects-empty-state"
          className="flex flex-col items-center justify-center p-12 sm:p-16 bg-white border border-zinc-200/80 rounded-2xl shadow-xs text-center space-y-3.5"
        >
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-500 shadow-2xs">
            {searchQuery ? (
              <SearchX className="w-6 h-6" />
            ) : (
              <FolderKanban className="w-6 h-6" />
            )}
          </div>
          <div className="max-w-md">
            <h3
              id="projects-empty-title"
              className="text-sm sm:text-base font-semibold text-zinc-900"
            >
              {searchQuery
                ? 'No matching projects found'
                : currentFilter !== 'all' || priorityFilter !== 'all'
                ? 'No projects match your current filters'
                : 'No projects in this workspace yet'}
            </h3>
            <p
              id="projects-empty-description"
              className="text-xs text-zinc-500 mt-1.5 leading-relaxed"
            >
              {searchQuery
                ? `We couldn't find any projects matching "${searchQuery}". Try a different keyword or reset your filters.`
                : currentFilter !== 'all' || priorityFilter !== 'all'
                ? `There are no projects matching the selected status or priority criteria.`
                : 'Create projects to group outcomes, organize goals, and coordinate tasks within Orbit.'}
            </p>
          </div>

          <div className="pt-2">
            {searchQuery || currentFilter !== 'all' || priorityFilter !== 'all' ? (
              <button
                type="button"
                id="reset-project-filters-btn"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-medium rounded-xl transition-colors cursor-pointer"
              >
                Reset filters
              </button>
            ) : (
              <button
                type="button"
                id="empty-create-project-btn"
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create first project</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Responsive Grid of Project Cards (Mobile 1 col, Tablet 2 cols, Desktop 3 cols) */
        <div
          id="projects-grid"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5"
        >
          {filteredProjects.map((project) => (
            <ProjectItem
              key={project.id}
              project={project}
              taskCount={taskCountMap[project.id] || 0}
              ownerName={ownerLabel}
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteWithFeedback}
              onStatusChange={handleQuickStatusChange}
              onPriorityChange={handleQuickPriorityChange}
              onOpenWorkspace={onSelectProject}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Project Modal */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModal}
        initialProject={editingProject}
        currentUser={currentUser}
      />
    </div>
  );
};
