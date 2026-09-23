import React from 'react';
import { Check, Clock, Calendar, Pencil, Trash2, Tag, FolderKanban } from 'lucide-react';
import { PriorityBadge } from './PriorityBadge';
import type { Task, Project } from '../types';

interface TaskItemProps {
  task: Task;
  projectName?: string;
  projects?: Project[];
  onToggle: (id: string) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (id: string) => void;
  onMoveToProject?: (taskId: string, newProjectId: string | null) => void;
  compact?: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  projectName,
  projects = [],
  onToggle,
  onEdit,
  onDelete,
  onMoveToProject,
  compact = false,
}) => {
  return (
    <div
      id={`task-item-${task.id}`}
      className="group bg-white hover:bg-zinc-50/80 border border-zinc-200/85 rounded-xl p-3.5 sm:p-4 transition-all duration-150 shadow-xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left section: Checkbox + Title + Category */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* Accessible Checkbox */}
          <button
            type="button"
            role="checkbox"
            id={`task-checkbox-${task.id}`}
            aria-checked={task.completed}
            aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
            onClick={() => onToggle(task.id)}
            className={`mt-0.5 sm:mt-0 w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-1 ${
              task.completed
                ? 'bg-zinc-900 border-zinc-900 text-white'
                : 'border-zinc-300 bg-white group-hover:border-zinc-400 text-transparent'
            }`}
          >
            <Check className="w-3 h-3 stroke-[2.5]" />
          </button>

          {/* Title and details */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start sm:items-center gap-2 flex-wrap">
              <span
                className={`text-sm font-medium transition-colors break-words ${
                  task.completed
                    ? 'line-through text-zinc-400'
                    : 'text-zinc-900'
                }`}
              >
                {task.title}
              </span>

              {task.category && !compact && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200/60 shrink-0">
                  <Tag className="w-2.5 h-2.5 text-zinc-400" />
                  <span>{task.category}</span>
                </span>
              )}

              {/* Project Association (S5.4: Task Organization) */}
              {!compact && task.projectId && projectName && (
                <div className="relative inline-flex items-center shrink-0">
                  <span
                    id={`task-project-badge-${task.id}`}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-700 bg-zinc-100/90 hover:bg-zinc-200/80 px-2 py-0.5 rounded-md border border-zinc-200/70 transition-colors"
                  >
                    <FolderKanban className="w-2.5 h-2.5 text-zinc-500" />
                    <span className="max-w-[130px] truncate">{projectName}</span>
                  </span>
                  {onMoveToProject && projects.length > 0 && (
                    <select
                      id={`task-project-select-${task.id}`}
                      value={task.projectId || ''}
                      onChange={(e) => onMoveToProject(task.id, e.target.value || null)}
                      aria-label={`Project for ${task.title}`}
                      title="Move task to another project or unassign"
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full text-xs"
                    >
                      <option value="">None / Unassigned (Remove from project)</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Unassigned Quick Action (Fitts's Law: 1-click assignment) */}
              {!compact && !task.projectId && onMoveToProject && projects.length > 0 && (
                <div className="relative inline-flex items-center shrink-0">
                  <span
                    id={`task-unassigned-badge-${task.id}`}
                    className="inline-flex items-center gap-1 text-[11px] font-normal text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 px-1.5 py-0.5 rounded-md border border-dashed border-zinc-200/90 transition-colors"
                  >
                    <FolderKanban className="w-2.5 h-2.5 text-zinc-400" />
                    <span>+ Project</span>
                  </span>
                  <select
                    id={`task-project-select-${task.id}`}
                    value=""
                    onChange={(e) => onMoveToProject(task.id, e.target.value || null)}
                    aria-label={`Assign ${task.title} to project`}
                    title="Assign to a project"
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full text-xs"
                  >
                    <option value="" disabled>
                      Assign to project...
                    </option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {task.description && !compact && (
              <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* Right section: Date, Time, Priority, Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 shrink-0 pt-2 sm:pt-0 border-t border-zinc-100 sm:border-t-0">
          {/* Due date & time badge */}
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            {task.dueDate && !compact && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3 h-3 text-zinc-400" />
                <span>{task.dueDate}</span>
              </span>
            )}
            {task.dueDate && !compact && <span>·</span>}
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3 text-zinc-400" />
              <span>{task.time}</span>
            </span>
          </div>

          {/* Priority */}
          <PriorityBadge priority={task.priority} />

          {/* Edit & Delete Action Buttons */}
          {!compact && (onEdit || onDelete) && (
            <div className="flex items-center gap-1 border-l border-zinc-200 pl-2">
              {onEdit && (
                <button
                  type="button"
                  id={`edit-task-btn-${task.id}`}
                  onClick={() => onEdit(task)}
                  aria-label={`Edit ${task.title}`}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  id={`delete-task-btn-${task.id}`}
                  onClick={() => onDelete(task.id)}
                  aria-label={`Delete ${task.title}`}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
