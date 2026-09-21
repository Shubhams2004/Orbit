import React from 'react';
import { Bot, User } from 'lucide-react';
import type { AssistantMessage } from '../types';

interface ChatMessageProps {
  message: AssistantMessage;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isAssistant = message.sender === 'assistant';

  return (
    <div
      id={`chat-message-${message.id}`}
      className={`flex items-start gap-3 w-full ${
        isAssistant ? 'justify-start' : 'justify-end'
      }`}
    >
      {/* Assistant Avatar */}
      {isAssistant && (
        <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
          <Bot className="w-4 h-4" />
        </div>
      )}

      {/* Bubble and Timestamp */}
      <div
        className={`flex flex-col max-w-[85%] sm:max-w-xl ${
          isAssistant ? 'items-start' : 'items-end'
        }`}
      >
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isAssistant
              ? 'bg-white text-zinc-900 border border-zinc-200/80 rounded-tl-sm shadow-xs'
              : 'bg-zinc-900 text-white rounded-tr-sm shadow-xs'
          }`}
        >
          {message.text}
        </div>

        {/* Timestamp */}
        <span className="text-[11px] text-zinc-400 mt-1 px-1">
          {message.timestamp}
        </span>
      </div>

      {/* User Avatar */}
      {!isAssistant && (
        <div className="w-8 h-8 rounded-full bg-zinc-200 text-zinc-700 flex items-center justify-center shrink-0 mt-0.5 text-xs font-semibold">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};
