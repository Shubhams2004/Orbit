import React, { useState } from 'react';
import { Calendar, PlusCircle, CheckSquare, Zap } from 'lucide-react';
import { AssistantInput } from './AssistantInput';
import { SuggestionButton } from './SuggestionButton';

export const HomePage: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [submittedNote, setSubmittedNote] = useState<string | null>(null);

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
    // In Step 1, keep it strictly frontend without real AI/backend
  };

  return (
    <div id="home-page" className="w-full max-w-2xl mx-auto py-8 sm:py-14 px-4 sm:px-6">
      {/* Greeting Header */}
      <header className="text-center mb-8 sm:mb-10">
        <h1
          id="home-greeting-heading"
          className="text-3xl sm:text-4xl font-semibold text-zinc-900 tracking-tight"
        >
          Good afternoon, Alex
        </h1>
        <p
          id="home-greeting-subtitle"
          className="mt-2.5 text-base sm:text-lg text-zinc-500 font-normal"
        >
          Your personal assistant is ready.
        </p>
      </header>

      {/* Large Empty Assistant Input Area */}
      <section aria-label="Assistant Query Area" className="mb-6">
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
              <strong className="font-semibold text-zinc-800">Draft prompt queued:</strong> &ldquo;{submittedNote}&rdquo;
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
      </section>

      {/* Four Suggestion Buttons */}
      <section aria-label="Quick Actions" className="pt-2">
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
    </div>
  );
};
