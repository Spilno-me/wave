import { Room, Participant, Message, RoomEvent, TypingIndicator } from '@/types';

const WAVE_AGENT: Participant = {
  id: 'wave-agent',
  type: 'agent',
  name: 'Wave',
  avatar: '/wave-avatar.png',
  joinedAt: new Date(),
};

declare global {
  // eslint-disable-next-line no-var
  var __roomStore: RoomStore | undefined;
}

class RoomStore {
  private rooms: Map<string, Room> = new Map();
  private eventListeners: Map<string, Set<(event: RoomEvent) => void>> = new Map();
  private typingIndicators: Map<string, TypingIndicator[]> = new Map();

  generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  createRoom(name: string, creatorName: string): Room {
    const roomId = this.generateId();
    const creator: Participant = {
      id: this.generateId(),
      type: 'human',
      name: creatorName,
      joinedAt: new Date(),
    };

    const room: Room = {
      id: roomId,
      name,
      createdBy: creator.id,
      participants: [creator, { ...WAVE_AGENT, joinedAt: new Date() }],
      messages: [],
      createdAt: new Date(),
    };

    this.rooms.set(roomId, room);
    this.eventListeners.set(roomId, new Set());
    this.typingIndicators.set(roomId, []);

    return room;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  joinRoom(roomId: string, participantName: string): { room: Room; participant: Participant } | undefined {
    const room = this.rooms.get(roomId);
    if (!room) return undefined;

    const existingParticipant = room.participants.find(
      (p) => p.name === participantName && p.type === 'human'
    );
    if (existingParticipant) {
      return { room, participant: existingParticipant };
    }

    const participant: Participant = {
      id: this.generateId(),
      type: 'human',
      name: participantName,
      joinedAt: new Date(),
    };

    room.participants.push(participant);
    
    this.emitEvent(roomId, {
      type: 'participant_joined',
      data: participant,
      timestamp: Date.now(),
    });

    return { room, participant };
  }

  addMessage(roomId: string, message: Omit<Message, 'id' | 'createdAt'>): Message | undefined {
    const room = this.rooms.get(roomId);
    if (!room) return undefined;

    const newMessage: Message = {
      ...message,
      id: this.generateId(),
      createdAt: new Date(),
    };

    room.messages.push(newMessage);

    this.emitEvent(roomId, {
      type: 'message',
      data: newMessage,
      timestamp: Date.now(),
    });

    return newMessage;
  }

  getMessages(roomId: string): Message[] {
    const room = this.rooms.get(roomId);
    return room?.messages || [];
  }

  setTyping(roomId: string, participantId: string): void {
    const indicators = this.typingIndicators.get(roomId) || [];
    const existing = indicators.find((i) => i.participantId === participantId);
    
    if (existing) {
      existing.timestamp = Date.now();
    } else {
      indicators.push({ participantId, roomId, timestamp: Date.now() });
      this.typingIndicators.set(roomId, indicators);
    }

    this.emitEvent(roomId, {
      type: 'typing',
      data: { participantId },
      timestamp: Date.now(),
    });
  }

  clearTyping(roomId: string, participantId: string): void {
    const indicators = this.typingIndicators.get(roomId) || [];
    const filtered = indicators.filter((i) => i.participantId !== participantId);
    this.typingIndicators.set(roomId, filtered);
  }

  getTypingParticipants(roomId: string): string[] {
    const indicators = this.typingIndicators.get(roomId) || [];
    const now = Date.now();
    return indicators
      .filter((i) => now - i.timestamp < 3000)
      .map((i) => i.participantId);
  }

  subscribe(roomId: string, callback: (event: RoomEvent) => void): () => void {
    const listeners = this.eventListeners.get(roomId);
    if (listeners) {
      listeners.add(callback);
    }
    return () => {
      listeners?.delete(callback);
    };
  }

  emitEvent(roomId: string, event: RoomEvent): void {
    const listeners = this.eventListeners.get(roomId);
    listeners?.forEach((callback) => callback(event));
  }

  getWaveAgent(): Participant {
    return WAVE_AGENT;
  }
}

function getRoomStore(): RoomStore {
  if (!global.__roomStore) {
    global.__roomStore = new RoomStore();
  }
  return global.__roomStore;
}

export const roomStore = getRoomStore();
