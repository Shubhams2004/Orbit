import React, { useState } from 'react';
import {
  Pencil,
  Trash2,
  Calendar,
  CheckCircle2,
  Archive,
  PlayCircle,
  FolderKanban,
  Clock,
  User,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import type { Project, ProjectPriority, ProjectStatus } from '../types';

interface ProjectItemProps {
  project: Project;
  taskCount?: number;
  ownerName?: string;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onStatusChange: (project: Project, newStatus: ProjectStatus) => void;
  onPriorityChange?: (project: Project, newPriority: ProjectPriority) => void;
  onOpenWorkspace?: (project: Project) => void;
}

export const ProjectItem: React.FC<ProjectItemProps> = ({
  project,
  taskCount = 0,
  ownerName = 'Alex (Personal Workspace)',
  onEdit,
  onDelete,
  onStatusChange,
  onPriorityChange,
  onOpenWorkspace,
}) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'active':
        return (
          <span
            id={`project-status-badge-${project.id}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60"
          >
            <PlayCircle className="w-3.5 h-3.5 text-emerald-600" />
            Active
          </span>
        );
      case 'completed':
        return (
          <span
            id={`project-status-badge-${project.id}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/60"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            Completed
          </span>
        );
      case 'archived':
        return (
          <span
            id={`project-status-badge-${project.id}`}
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
            id={`project-priority-badge-${project.id}`}
            className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200/60"
          >
            High priority
          </span>
        );
      case 'medium':
        return (
          <span
            id={`project-priority-badge-${project.id}`}
            className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/60"
          >
            Medium priority
          </span>
        );
      case 'low':
      default:
        return (
          <span
            id={`project-priority-badge-${project.id}`}
            className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-100 text-zinc-600 border border-zinc-200/60"
          >
            Low priority
          </span>
        );
    }
  };

  const formattedCreatedDate = new Date(project.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedUpdatedDate = project.updatedAt
    ? new Date(project.updatedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div
      id={`project-card-${project.id}`}
      className="bg-white border border-zinc-200/80 hover:border-zinc-300 rounded-xl p-5 shadow-xs hover:shadow-sm transition-all duration-150 flex flex-col justify-between group relative"
    >
      <div>
        {/* Top bar: Badges, Context & Actions */}
        <div className="flex items-start justify-between gap-3 mb-3.5">
          {/* Status, Priority & Task count */}
          <div className="flex items-center gap-2 flex-wrap">
            {getStatusBadge(project.status)}
            {getPriorityBadge(project.priority)}
            <span
              id={`project-task-count-${project.id}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-50 text-zinc-600 border border-zinc-200/50"
            >
              <FolderKanban className="w-3 h-3 text-zinc-400" />
              <span>
                {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
              </span>
            </span>
          </div>

          {/* Action buttons (Edit & Delete) */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              id={`edit-project-btn-${project.id}`}
              onClick={() => onEdit(project)}
              className="p-1.5 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
              title="Edit project"
              aria-label={`Edit ${project.name}`}
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              id={`delete-project-btn-${project.id}`}
              onClick={() => setIsConfirmingDelete(true)}
              className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Delete project"
              aria-label={`Delete ${project.name}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Project Name & Open Workspace Action */}
        <h3 className="mb-1.5">
          <button
            type="button"
            id={`project-title-${project.id}`}
            onClick={() => onOpenWorkspace?.(project)}
            className="text-left text-base font-semibold text-zinc-900 hover:text-zinc-950 hover:underline tracking-tight leading-snug cursor-pointer transition-colors"
          >
            {project.name}
          </button>
        </h3>

        {/* Project Description */}
        {project.description ? (
          <p
            id={`project-desc-${project.id}`}
            className="text-xs text-zinc-600 line-clamp-3 leading-relaxed mb-3"
          >
            {project.description}
          </p>
        ) : (
          <p className="text-xs text-zinc-400 italic mb-3">No description provided.</p>
        )}

        {/* Project Ownership / Context */}
        <div
          id={`project-owner-${project.id}`}
          className="flex items-center gap-1.5 text-[11px] text-zinc-500 mb-3 bg-zinc-50/80 px-2.5 py-1.5 rounded-lg border border-zinc-200/50"
        >
          <User className="w-3 h-3 text-zinc-400 shrink-0" />
          <span className="truncate">Context: {ownerName}</span>
        </div>

        {/* Open Workspace Action Button (Fitts's Law) */}
        {onOpenWorkspace && (
          <button
            type="button"
            id={`open-workspace-btn-${project.id}`}
            onClick={() => onOpenWorkspace(project)}
            className="w-full mb-3.5 flex items-center justify-between px-3 py-2 text-xs font-medium text-zinc-800 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200/90 rounded-xl transition-colors cursor-pointer group/btn"
          >
            <span className="font-semibold">Open Project Workspace</span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>

      {/* Card Footer: Metadata and Interactive Controls */}
      <div className="pt-3 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-zinc-400">
        <div className="flex items-center gap-2 text-[11px] flex-wrap">
          <span className="inline-flex items-center gap-1">
            <Calendar className="w-3 h-3 text-zinc-400" />
            <span>{formattedCreatedDate}</span>
          </span>
          {formattedUpdatedDate && formattedUpdatedDate !== formattedCreatedDate && (
            <>
              <span>·</span>
              <span className="inline-flex items-center gap-1 text-zinc-400">
                <Clock className="w-3 h-3 text-zinc-400" />
                <span>Updated {formattedUpdatedDate}</span>
              </span>
            </>
          )}
        </div>

        {/* Controls: Quick Status and Priority Switchers */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          {/* Status selector */}
          <label htmlFor={`project-status-select-${project.id}`} className="sr-only">
            Change status for {project.name}
          </label>
          <select
            id={`project-status-quick-select-${project.id}`}
            value={project.status}
            onChange={(e) => onStatusChange(project, e.target.value as ProjectStatus)}
            aria-label={`Status for ${project.name}`}
            className="text-[11px] bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200 rounded-lg px-2 py-1 text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-900 cursor-pointer transition-colors"
          >
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>

          {/* Priority selector */}
          {onPriorityChange && (
            <>
              <label htmlFor={`project-priority-quick-select-${project.id}`} className="sr-only">
                Change priority for {project.name}
              </label>
              <select
                id={`project-priority-quick-select-${project.id}`}
                value={project.priority}
                onChange={(e) => onPriorityChange(project, e.target.value as ProjectPriority)}
                aria-label={`Priority for ${project.name}`}
                className="text-[11px] bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200 rounded-lg px-2 py-1 text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-900 cursor-pointer transition-colors"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Overlay / Dialog (Fitts's Law & Tesler's Law) */}
      {isConfirmingDelete && (
        <div
          id={`delete-confirmation-dialog-${project.id}`}
          className="absolute inset-0 bg-white/98 backdrop-blur-xs rounded-xl p-5 flex flex-col justify-between z-10 border border-rose-200 animate-fade-in shadow-md"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-rose-700 font-semibold text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>Delete project?</span>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Are you sure you want to delete <strong className="text-zinc-900 font-medium">{project.name}</strong>?
            </p>
            <p className="text-[11px] text-zinc-500 bg-zinc-50 p-2 rounded-lg border border-zinc-200/60">
              Any associated tasks will remain safely preserved and will become unassigned.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
            <button
              type="button"
              id={`cancel-delete-project-btn-${project.id}`}
              onClick={() => setIsConfirmingDelete(false)}
              className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              id={`confirm-delete-project-btn-${project.id}`}
              onClick={() => {
                setIsConfirmingDelete(false);
                onDelete(project.id);
              }}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Delete project
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
