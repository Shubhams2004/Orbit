import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Task, TaskPriority } from '../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    description: string;
    dueDate: string;
    time: string;
    priority: TaskPriority;
    category: string;
  }) => void;
  initialTask?: Task | null;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTask,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('Today');
  const [time, setTime] = useState('12:00 PM');
  const [priority, setPriority] = useState<TaskPriority>('Medium priority');
  const [category, setCategory] = useState('Work');
  const [error, setError] = useState('');

  const isEditing = Boolean(initialTask);

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || '');
      setDueDate(initialTask.dueDate || 'Today');
      setTime(initialTask.time || '12:00 PM');
      setPriority(initialTask.priority);
      setCategory(initialTask.category || 'Work');
    } else {
      setTitle('');
      setDescription('');
      setDueDate('Today');
      setTime('10:00 AM');
      setPriority('Medium priority');
      setCategory('Work');
    }
    setError('');
  }, [initialTask, isOpen]);

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
    if (!title.trim()) {
      setError('Please enter a task title.');
      return;
    }

    onSave({
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate.trim() || 'Today',
      time: time.trim() || '12:00 PM',
      priority,
      category: category.trim() || 'General',
    });
    onClose();
  };

  return (
    <div
      id="task-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        id="task-modal-container"
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-zinc-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div>
            <h2
              id="task-modal-title"
              className="text-lg font-semibold text-zinc-900"
            >
              {isEditing ? 'Edit task' : 'Create new task'}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {isEditing
                ? 'Update your task details below'
                : 'Fill in the information to schedule a task'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label
              htmlFor="task-modal-title-input"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5"
            >
              Task title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="task-modal-title-input"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Review project proposal"
              className="w-full px-3.5 py-2 bg-white text-zinc-900 placeholder:text-zinc-400 text-sm rounded-xl border border-zinc-200 hover:border-zinc-300 focus:outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-900/5 transition-colors"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="task-modal-desc-input"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5"
            >
              Description
            </label>
            <textarea
              id="task-modal-desc-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add extra context, notes, or links..."
              rows={2}
              className="w-full px-3.5 py-2 bg-white text-zinc-900 placeholder:text-zinc-400 text-sm rounded-xl border border-zinc-200 hover:border-zinc-300 focus:outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-900/5 transition-colors resize-none"
            />
          </div>

          {/* Date and Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="task-modal-date-input"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5"
              >
                Date
              </label>
              <input
                type="text"
                id="task-modal-date-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder="e.g. Today, Tomorrow, Oct 24"
                className="w-full px-3.5 py-2 bg-white text-zinc-900 placeholder:text-zinc-400 text-sm rounded-xl border border-zinc-200 hover:border-zinc-300 focus:outline-none focus:border-zinc-500 transition-colors"
              />
            </div>
            <div>
              <label
                htmlFor="task-modal-time-input"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5"
              >
                Time
              </label>
              <input
                type="text"
                id="task-modal-time-input"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="e.g. 10:00 AM"
                className="w-full px-3.5 py-2 bg-white text-zinc-900 placeholder:text-zinc-400 text-sm rounded-xl border border-zinc-200 hover:border-zinc-300 focus:outline-none focus:border-zinc-500 transition-colors"
              />
            </div>
          </div>

          {/* Priority and Category Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="task-modal-priority-select"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5"
              >
                Priority
              </label>
              <select
                id="task-modal-priority-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3.5 py-2 bg-white text-zinc-900 text-sm rounded-xl border border-zinc-200 hover:border-zinc-300 focus:outline-none focus:border-zinc-500 transition-colors cursor-pointer"
              >
                <option value="High priority">High priority</option>
                <option value="Medium priority">Medium priority</option>
                <option value="Low priority">Low priority</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="task-modal-category-input"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5"
              >
                Category
              </label>
              <input
                type="text"
                id="task-modal-category-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Work, Personal, Meeting"
                className="w-full px-3.5 py-2 bg-white text-zinc-900 placeholder:text-zinc-400 text-sm rounded-xl border border-zinc-200 hover:border-zinc-300 focus:outline-none focus:border-zinc-500 transition-colors"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
            <button
              type="button"
              id="task-modal-cancel-btn"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="task-modal-submit-btn"
              className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              {isEditing ? 'Save changes' : 'Create task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
