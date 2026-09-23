import React, { useState, useEffect } from 'react';
import { X, PlayCircle, CheckCircle2, Archive, User, ShieldCheck } from 'lucide-react';
import type { Project, ProjectPriority, ProjectStatus, UserProfile } from '../types';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    description: string;
    status: ProjectStatus;
    priority: ProjectPriority;
  }) => void;
  initialProject?: Project | null;
  currentUser?: UserProfile;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialProject,
  currentUser,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('active');
  const [priority, setPriority] = useState<ProjectPriority>('medium');
  const [error, setError] = useState('');

  const isEditing = Boolean(initialProject);

  useEffect(() => {
    if (initialProject) {
      setName(initialProject.name);
      setDescription(initialProject.description || '');
      setStatus(initialProject.status);
      setPriority(initialProject.priority);
    } else {
      setName('');
      setDescription('');
      setStatus('active');
      setPriority('medium');
    }
    setError('');
  }, [initialProject, isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a project name.');
      return;
    }

    onSave({
      name: name.trim(),
      description: description.trim(),
      status,
      priority,
    });
    onClose();
  };

  const ownerDisplayName = currentUser?.name
    ? `${currentUser.name} (${currentUser.role || 'Personal Workspace'})`
    : 'Alex (Personal Workspace)';

  return (
    <div
      id="project-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        id="project-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-modal-title"
        className="bg-white rounded-2xl shadow-xl border border-zinc-200/80 w-full max-w-lg overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div>
            <h3
              id="project-modal-title"
              className="text-base font-semibold text-zinc-900"
            >
              {isEditing ? 'Edit Project' : 'Create New Project'}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {isEditing
                ? 'Update project scope, priority, or status.'
                : 'Define a new body of work or outcome in your workspace.'}
            </p>
          </div>
          <button
            type="button"
            id="project-modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
            className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div
              id="project-modal-error"
              className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xl font-medium"
            >
              {error}
            </div>
          )}

          {/* Project Name (Jakob's Law & Fitts's Law) */}
          <div>
            <label
              htmlFor="project-name-input"
              className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5"
            >
              Project Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="project-name-input"
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Workspace Infrastructure, Q4 Product Launch"
              className="w-full text-sm px-3.5 py-2.5 bg-zinc-50/50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all text-zinc-900"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="project-description-input"
              className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5"
            >
              Description (Optional)
            </label>
            <textarea
              id="project-description-input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of the outcome, scope, and objectives..."
              className="w-full text-sm px-3.5 py-2.5 bg-zinc-50/50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all text-zinc-900 resize-none leading-relaxed"
            />
          </div>

          {/* Status & Priority Segmented Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Status Selector */}
            <div>
              <label
                htmlFor="project-status-select"
                className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5"
              >
                Status
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-100 rounded-xl border border-zinc-200/60">
                <button
                  type="button"
                  id="project-status-opt-active"
                  onClick={() => setStatus('active')}
                  className={`py-1.5 text-xs font-medium rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    status === 'active'
                      ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200/80'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <PlayCircle className="w-3 h-3 text-emerald-600" />
                  <span>Active</span>
                </button>
                <button
                  type="button"
                  id="project-status-opt-completed"
                  onClick={() => setStatus('completed')}
                  className={`py-1.5 text-xs font-medium rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    status === 'completed'
                      ? 'bg-white text-blue-700 shadow-xs border border-blue-200/80'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3 text-blue-600" />
                  <span>Done</span>
                </button>
                <button
                  type="button"
                  id="project-status-opt-archived"
                  onClick={() => setStatus('archived')}
                  className={`py-1.5 text-xs font-medium rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    status === 'archived'
                      ? 'bg-white text-zinc-800 shadow-xs border border-zinc-300'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <Archive className="w-3 h-3 text-zinc-500" />
                  <span>Archive</span>
                </button>
              </div>
            </div>

            {/* Priority Selector */}
            <div>
              <label
                htmlFor="project-priority-select"
                className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5"
              >
                Priority
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-100 rounded-xl border border-zinc-200/60">
                <button
                  type="button"
                  id="project-priority-opt-low"
                  onClick={() => setPriority('low')}
                  className={`py-1.5 text-xs font-medium rounded-lg text-center transition-all cursor-pointer ${
                    priority === 'low'
                      ? 'bg-white text-zinc-800 shadow-xs border border-zinc-300'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Low
                </button>
                <button
                  type="button"
                  id="project-priority-opt-medium"
                  onClick={() => setPriority('medium')}
                  className={`py-1.5 text-xs font-medium rounded-lg text-center transition-all cursor-pointer ${
                    priority === 'medium'
                      ? 'bg-white text-amber-700 shadow-xs border border-amber-200/80'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Medium
                </button>
                <button
                  type="button"
                  id="project-priority-opt-high"
                  onClick={() => setPriority('high')}
                  className={`py-1.5 text-xs font-medium rounded-lg text-center transition-all cursor-pointer ${
                    priority === 'high'
                      ? 'bg-white text-rose-700 shadow-xs border border-rose-200/80'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  High
                </button>
              </div>
            </div>
          </div>

          {/* Ownership & Context Note (Clear Indication) */}
          <div
            id="project-modal-context-note"
            className="flex items-center gap-2 p-3 bg-zinc-50 rounded-xl border border-zinc-200/70 text-xs text-zinc-500"
          >
            <ShieldCheck className="w-4 h-4 text-zinc-400 shrink-0" />
            <div className="flex-1 truncate">
              <span>Scoped to </span>
              <strong className="text-zinc-700 font-medium">{ownerDisplayName}</strong>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
            <button
              type="button"
              id="project-modal-cancel-btn"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="project-modal-save-btn"
              className="px-4 py-2.5 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              {isEditing ? 'Save changes' : 'Create project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
