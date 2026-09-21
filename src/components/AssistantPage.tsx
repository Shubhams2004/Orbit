import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Calendar,
  CheckSquare,
  Zap,
  ListTodo,
} from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { SuggestionChip } from './SuggestionChip';
import { MessageComposer } from './MessageComposer';
import { ThinkingIndicator } from './ThinkingIndicator';
import { CapabilityCard } from './CapabilityCard';
import type { AssistantMessage } from '../types';

export const AssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'msg-initial',
      sender: 'assistant',
      text: 'Hi Alex. What would you like to get done?',
      timestamp: '10:00 AM',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    { id: 'sugg-plan', text: 'Plan my day', icon: Calendar },
    { id: 'sugg-create', text: 'Create a task', icon: CheckSquare },
    { id: 'sugg-show', text: 'Show my tasks', icon: ListTodo },
    { id: 'sugg-automation', text: 'Create an automation', icon: Zap },
  ];

  // Auto-scroll to newest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const getMockResponse = (userText: string): string => {
    const lower = userText.toLowerCase().trim();
    if (
      lower.includes('show my tasks') ||
      lower.includes('my tasks') ||
      lower.includes('task') ||
      lower.includes('create a task')
    ) {
      return 'I can help organize your tasks. Your current task list contains several items that need attention.';
    }
    if (
      lower.includes('plan') ||
      lower.includes('day') ||
      lower.includes('schedule')
    ) {
      return 'I can help plan your day. You currently have several tasks scheduled today.';
    }
    if (
      lower.includes('automation') ||
      lower.includes('automate') ||
      lower.includes('workflow')
    ) {
      return 'I can help you create an automation by defining a trigger, conditions, and actions.';
    }
    return "I'm ready to help. Once the AI backend is connected, I'll be able to understand and act on more complex requests.";
  };

  const handleSendMessage = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isThinking) return;

    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });

    const userMsg: AssistantMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: formattedTime,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsThinking(true);

    // Simulated assistant latency
    setTimeout(() => {
      const assistantText = getMockResponse(trimmed);
      const replyTime = new Date().toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      });

      const replyMsg: AssistantMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: assistantText,
        timestamp: replyTime,
      };

      setMessages((prev) => [...prev, replyMsg]);
      setIsThinking(false);
    }, 700);
  };

  const handleSuggestionClick = (suggestionText: string) => {
    setInputValue(suggestionText);
  };

  return (
    <div
      id="assistant-page"
      className="w-full max-w-4xl mx-auto flex flex-col h-[calc(100vh-6rem)] sm:h-[calc(100vh-6.5rem)] pb-2"
    >
      {/* Header */}
      <header className="shrink-0 mb-3 sm:mb-4 px-1">
        <div className="flex items-center gap-2">
          <h1
            id="assistant-page-heading"
            className="text-2xl sm:text-3xl font-semibold text-zinc-900 tracking-tight flex items-center gap-2"
          >
            <span>Assistant</span>
            <span className="p-1 rounded-md bg-zinc-100 text-zinc-600">
              <Sparkles className="w-4 h-4 text-zinc-700" />
            </span>
          </h1>
        </div>
        <p
          id="assistant-page-subtitle"
          className="mt-1 text-sm sm:text-base text-zinc-500 font-normal"
        >
          Your personal assistant for tasks, planning, and automation.
        </p>
      </header>

      {/* Main Chat & Scrollable Area */}
      <div
        id="assistant-messages-container"
        className="flex-1 overflow-y-auto pr-1 space-y-4 pb-4 scrollbar-thin"
      >
        {/* Render Conversation */}
        {messages.map((msg, index) => (
          <React.Fragment key={msg.id}>
            <ChatMessage message={msg} />

            {/* Show suggestions right below the initial assistant welcome message */}
            {index === 0 && (
              <div
                id="initial-assistant-suggestions"
                className="pl-11 space-y-3 pt-1"
              >
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((sugg) => (
                    <SuggestionChip
                      key={sugg.id}
                      id={sugg.id}
                      text={sugg.text}
                      icon={sugg.icon}
                      onClick={handleSuggestionClick}
                    />
                  ))}
                </div>

                {/* Assistant Capabilities Section */}
                <div
                  id="assistant-capabilities-section"
                  className="pt-3 pb-1"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2.5">
                    Core Capabilities
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <CapabilityCard
                      id="cap-card-tasks"
                      icon={CheckSquare}
                      title="Tasks"
                      description="Create, organize, prioritize, and manage tasks."
                      onClick={() => handleSuggestionClick('Create a task')}
                    />
                    <CapabilityCard
                      id="cap-card-planning"
                      icon={Calendar}
                      title="Planning"
                      description="Help structure the user's day and upcoming work."
                      onClick={() => handleSuggestionClick('Plan my day')}
                    />
                    <CapabilityCard
                      id="cap-card-automation"
                      icon={Zap}
                      title="Automation"
                      description="Create workflows based on triggers and actions."
                      onClick={() => handleSuggestionClick('Create an automation')}
                    />
                  </div>
                </div>
              </div>
            )}
          </React.Fragment>
        ))}

        {/* Temporary Thinking Indicator */}
        {isThinking && <ThinkingIndicator />}

        {/* Anchor for auto-scroll */}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Composer Footer */}
      <footer className="shrink-0 pt-2">
        <MessageComposer
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSendMessage}
          disabled={isThinking}
          placeholder="Ask Orbit anything (e.g., Plan my day, Create a task)..."
        />
      </footer>
    </div>
  );
};
