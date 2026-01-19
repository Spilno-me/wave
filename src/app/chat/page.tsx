'use client';

import { useChat } from 'ai/react';
import { useState } from 'react';

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat();
  const [showError, setShowError] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 p-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-white">Wave</h1>
            <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded">Session</span>
          </div>
          <span className="text-gray-500 text-sm">CEDA Collaborative Workspace</span>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-20">
              <h2 className="text-2xl font-light mb-4 text-gray-300">Welcome to Wave</h2>
              <p className="text-gray-500 mb-8">
                Start a conversation to collaborate with AI on your enterprise tasks.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
                <button
                  onClick={() => handleInputChange({ target: { value: 'Help me create an HSE compliance module' } } as any)}
                  className="p-4 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-700 transition-colors"
                >
                  <div className="text-sm font-medium text-gray-300 mb-1">HSE Module</div>
                  <div className="text-xs text-gray-500">Create compliance workflows</div>
                </button>
                <button
                  onClick={() => handleInputChange({ target: { value: 'What patterns have been learned recently?' } } as any)}
                  className="p-4 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-700 transition-colors"
                >
                  <div className="text-sm font-medium text-gray-300 mb-1">Patterns</div>
                  <div className="text-xs text-gray-500">Review CEDA insights</div>
                </button>
                <button
                  onClick={() => handleInputChange({ target: { value: 'Help me draft a team update' } } as any)}
                  className="p-4 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-700 transition-colors"
                >
                  <div className="text-sm font-medium text-gray-300 mb-1">Draft</div>
                  <div className="text-xs text-gray-500">Collaborative writing</div>
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-400 text-sm">
              Connection error. Please check your API configuration.
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-900 border border-gray-800 text-gray-100'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
                <div className="flex space-x-1.5">
                  <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Input */}
      <footer className="border-t border-gray-800 p-4 flex-shrink-0">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="Send a message..."
              className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-600 transition-colors"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Send
            </button>
          </div>
        </form>
      </footer>
    </div>
  );
}
