import React, { useState } from 'react';
import {
  Calendar,
  PlusCircle,
  CheckSquare,
  Zap,
  CheckCircle2,
  Clock,
  ListTodo,
} from 'lucide-react';
import { AssistantInput } from './AssistantInput';
import { SuggestionButton } from './SuggestionButton';
import { OverviewCard } from './OverviewCard';
import { TaskList } from './TaskList';
import { ActivityList } from './ActivityList';
import { initialTasks, initialActivities } from '../mockData';
import type { Task, Activity } from '../types';

interface HomePageProps {
  tasks?: Task[];
  onToggleTask?: (id: string) => void;
  onNavigateToTasks?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  tasks: propTasks,
  onToggleTask: propOnToggleTask,
  onNavigateToTasks,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [submittedNote, setSubmittedNote] = useState<string | null>(null);

  // Local fallback tasks if not passed from parent
  const [localTasks, setLocalTasks] = useState<Task[]>(initialTasks);

  const tasks = propTasks || localTasks;

  const handleToggleTask = (id: string) => {
    if (propOnToggleTask) {
      propOnToggleTask(id);
    } else {
      setLocalTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
      );
    }
  };

  // Mock recent activity list
  const activities: Activity[] = initialActivities;

  const tasksToday = tasks.filter((t) => (t.dueDate || '').toLowerCase().includes('today'));
  const completedCount = tasks.filter((t) => t.completed).length;
  const upcomingCount = tasks.filter(
    (t) =>
      !t.completed &&
      ((t.dueDate || '').toLowerCase().includes('tomorrow') ||
        !(t.dueDate || '').toLowerCase().includes('today'))
  ).length;
  const displayTasks = tasksToday.length > 0 ? tasksToday.slice(0, 4) : tasks.slice(0, 4);

  const suggestions = [
    {
      id: 'suggestion-plan-day',
      label: 'Plan my day',
      description: 'Review schedule and prioritize key milestones',
      icon: Calendar,
      promptText: 'Plan my day and highlight priorities',
    },
    {
      id: 'suggestion-create-task',
      label: 'Create a task',
      description: 'Quickly draft a new todo item or action list',
      icon: PlusCircle,
      promptText: 'Create a new task: ',
    },
    {
      id: 'suggestion-show-tasks',
      label: 'Show my tasks',
      description: 'View active items, deadlines, and progress',
      icon: CheckSquare,
      promptText: 'Show my active tasks for today',
    },
    {
      id: 'suggestion-create-automation',
      label: 'Create an automation',
      description: 'Set up automated rules, triggers, and workflows',
      icon: Zap,
      promptText: 'Create a new automation workflow',
    },
  ];

  const handleSuggestionClick = (promptText: string) => {
    setInputValue(promptText);
    setSubmittedNote(null);
  };

  const handleSubmit = (text: string) => {
    setSubmittedNote(text);
  };

  return (
    <div id="home-page" className="w-full max-w-2xl mx-auto py-6 sm:py-10 px-4 sm:px-6 space-y-8 sm:space-y-10">
      {/* 1. Existing Top Section */}
      <section id="home-top-section" aria-label="Greeting and Assistant Prompt">
        {/* Greeting Header */}
        <header className="text-center mb-6 sm:mb-8">
          <h1
            id="home-greeting-heading"
            className="text-3xl sm:text-4xl font-semibold text-zinc-900 tracking-tight"
          >
            Good afternoon, Alex
          </h1>
          <p
            id="home-greeting-subtitle"
            className="mt-2 text-base sm:text-lg text-zinc-500 font-normal"
          >
            Your personal assistant is ready.
          </p>
        </header>

        {/* Large Empty Assistant Input Area */}
        <div className="mb-5">
          <AssistantInput
            id="assistant-query-input"
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSubmit}
            placeholder="What can I help you with?"
          />

          {submittedNote && (
            <div
              id="submitted-preview-banner"
              className="mt-3.5 p-3.5 rounded-xl bg-zinc-100 border border-zinc-200/80 text-xs text-zinc-600 flex items-center justify-between transition-all"
            >
              <span>
                <strong className="font-semibold text-zinc-800">
                  Draft prompt queued:
                </strong>{' '}
                &ldquo;{submittedNote}&rdquo;
              </span>
              <button
                type="button"
                onClick={() => setSubmittedNote(null)}
                className="text-zinc-400 hover:text-zinc-700 ml-2 text-xs cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        {/* Four Suggestion Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {suggestions.map((item) => (
            <SuggestionButton
              key={item.id}
              id={item.id}
              label={item.label}
              description={item.description}
              icon={item.icon}
              onClick={() => handleSuggestionClick(item.promptText)}
            />
          ))}
        </div>
      </section>

      {/* 2. Today's Overview Section */}
      <section id="todays-overview-section" aria-label="Today's Overview">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Today&apos;s Overview
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <OverviewCard
            id="overview-card-tasks-today"
            label="Tasks today"
            count={tasksToday.length}
            icon={ListTodo}
            iconColorClass="text-zinc-700 bg-zinc-100"
          />
          <OverviewCard
            id="overview-card-completed"
            label="Completed"
            count={completedCount}
            icon={CheckCircle2}
            iconColorClass="text-emerald-700 bg-emerald-50"
          />
          <OverviewCard
            id="overview-card-upcoming"
            label="Upcoming"
            count={upcomingCount}
            icon={Clock}
            iconColorClass="text-amber-700 bg-amber-50"
          />
          <OverviewCard
            id="overview-card-automations"
            label="Active automations"
            count={4}
            icon={Zap}
            iconColorClass="text-sky-700 bg-sky-50"
          />
        </div>
      </section>

      {/* 3. Today's Tasks Section */}
      <TaskList
        tasks={displayTasks}
        onToggleTask={handleToggleTask}
        onViewAll={onNavigateToTasks}
      />

      {/* 4. Recent Activity Section */}
      <ActivityList activities={activities} />
    </div>
  );
};
