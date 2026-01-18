'use client';

import { Message, MessageContent, Participant } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface MessageListProps {
  messages: Message[];
  participants: Participant[];
  streamingMessage?: { participantId: string; text: string } | null;
  onButtonAction?: (action: string) => void;
}

export function MessageList({ messages, participants, streamingMessage, onButtonAction }: MessageListProps) {
  const getParticipantById = (id: string): Participant | undefined => {
    return participants.find((p) => p.id === id);
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderMessageContent = (content: MessageContent[]) => {
    return content.map((item, index) => {
      switch (item.type) {
        case 'text':
          return (
            <p key={index} className="whitespace-pre-wrap">
              {item.text}
            </p>
          );
        case 'button':
          return (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="mr-2 mt-2"
              onClick={() => onButtonAction?.(item.action)}
            >
              {item.label}
            </Button>
          );
        case 'image':
          return (
            <img
              key={index}
              src={item.url}
              alt="Shared image"
              className="max-w-md rounded-lg mt-2"
            />
          );
        case 'file':
          return (
            <a
              key={index}
              href={item.url}
              className="text-blue-500 hover:underline mt-2 block"
              target="_blank"
              rel="noopener noreferrer"
            >
              {item.name}
            </a>
          );
        case 'table':
          return (
            <div key={index} className="overflow-x-auto mt-2">
              <table className="min-w-full border border-neutral-700">
                <thead>
                  <tr>
                    {item.headers.map((header, i) => (
                      <th key={i} className="px-4 py-2 border-b border-neutral-700 text-left">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {item.rows.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j} className="px-4 py-2 border-b border-neutral-700">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        case 'artifact':
          return (
            <div key={index} className="mt-2 p-4 bg-neutral-800 rounded-lg">
              <p className="text-sm text-neutral-300">{item.preview}</p>
              <div className="mt-2 flex gap-2">
                {item.actions.map((action, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    onClick={() => onButtonAction?.(action.action)}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          );
        default:
          return null;
      }
    });
  };

  return (
    <div className="space-y-6">
      {messages.map((message) => {
        const sender = getParticipantById(message.participantId);
        const isAgent = sender?.type === 'agent';

        return (
          <div key={message.id} className="flex gap-4">
            <Avatar className={isAgent ? 'bg-blue-600' : 'bg-neutral-700'}>
              <AvatarFallback className={isAgent ? 'bg-blue-600 text-white' : 'bg-neutral-700 text-white'}>
                {sender ? getInitials(sender.name) : '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`font-medium ${isAgent ? 'text-blue-400' : 'text-white'}`}>
                  {sender?.name || 'Unknown'}
                </span>
                {isAgent && (
                  <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded">
                    AI
                  </span>
                )}
                <span className="text-xs text-neutral-500">
                  {new Date(message.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <div className="text-neutral-200">
                {renderMessageContent(message.content)}
              </div>
            </div>
          </div>
        );
      })}

      {streamingMessage && (
        <div className="flex gap-4">
          <Avatar className="bg-blue-600">
            <AvatarFallback className="bg-blue-600 text-white">W</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-blue-400">Wave</span>
              <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded">
                AI
              </span>
            </div>
            <div className="text-neutral-200">
              <p className="whitespace-pre-wrap">{streamingMessage.text}</p>
              <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-1" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
