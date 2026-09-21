import React from 'react';
import { Search, X } from 'lucide-react';

interface TaskSearchProps {
  value: string;
  onChange: (query: string) => void;
  placeholder?: string;
  id?: string;
}

export const TaskSearch: React.FC<TaskSearchProps> = ({
  value,
  onChange,
  placeholder = 'Search tasks by title, category...',
  id = 'task-search-input',
}) => {
  return (
    <div className="relative flex-1 min-w-[200px]">
      <label htmlFor={id} className="sr-only">
        Search tasks
      </label>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
        <Search className="w-4 h-4" />
      </div>
      <input
        type="text"
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2 bg-white text-zinc-900 placeholder:text-zinc-400 text-sm rounded-xl border border-zinc-200 hover:border-zinc-300 focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 transition-colors shadow-2xs"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-zinc-400 hover:text-zinc-600 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
