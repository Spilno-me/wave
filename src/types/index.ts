export interface Room {
  id: string;
  name: string;
  createdBy: string;
  participants: Participant[];
  messages: Message[];
  createdAt: Date;
}

export interface Participant {
  id: string;
  type: 'human' | 'agent';
  name: string;
  avatar?: string;
  joinedAt: Date;
}

export interface Message {
  id: string;
  roomId: string;
  participantId: string;
  content: MessageContent[];
  createdAt: Date;
}

export type MessageContent =
  | { type: 'text'; text: string }
  | { type: 'artifact'; preview: string; actions: Action[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'image'; url: string }
  | { type: 'file'; name: string; url: string }
  | { type: 'button'; label: string; action: string };

export interface Action {
  label: string;
  action: string;
}

export interface TypingIndicator {
  participantId: string;
  roomId: string;
  timestamp: number;
}

export interface RoomEvent {
  type: 'message' | 'participant_joined' | 'participant_left' | 'typing' | 'ai_streaming';
  data: unknown;
  timestamp: number;
}
