'use client';

import { Participant } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ParticipantListProps {
  participants: Participant[];
}

export function ParticipantList({ participants }: ParticipantListProps) {
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-3">
      {participants.map((p) => (
        <div key={p.id} className="flex items-center gap-3">
          <Avatar className={`w-8 h-8 ${p.type === 'agent' ? 'bg-blue-600' : 'bg-neutral-700'}`}>
            <AvatarFallback className={`text-xs ${p.type === 'agent' ? 'bg-blue-600 text-white' : 'bg-neutral-700 text-white'}`}>
              {getInitials(p.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm text-white">{p.name}</div>
            <div className="text-xs text-neutral-500">
              {p.type === 'agent' ? 'AI Assistant' : 'Human'}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
