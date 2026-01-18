import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { getFirestoreDb, isFirebaseConfigured } from './firebase';
import { Room, Participant, Message, MessageContent, RoomEvent } from '@/types';
import { generatePseudonym } from './pseudonym';

const WAVE_AGENT: Participant = {
  id: 'wave-agent',
  type: 'agent',
  name: 'Wave',
  joinedAt: new Date(),
};

type EventListener = (event: RoomEvent) => void;

class InMemoryStore {
  private rooms: Map<string, Room> = new Map();
  private listeners: Map<string, Set<EventListener>> = new Map();

  async createRoom(name: string, creatorName: string, creatorUid?: string): Promise<{ room: Room; participant: Participant }> {
    const roomId = crypto.randomUUID();
    const participantId = creatorUid ? generatePseudonym(creatorUid) : crypto.randomUUID();

    const creator: Participant = {
      id: participantId,
      type: 'human',
      name: creatorName,
      joinedAt: new Date(),
    };

    const room: Room = {
      id: roomId,
      name,
      createdBy: participantId,
      participants: [creator, WAVE_AGENT],
      messages: [],
      createdAt: new Date(),
    };

    this.rooms.set(roomId, room);
    return { room, participant: creator };
  }

  async getRoom(roomId: string): Promise<Room | null> {
    return this.rooms.get(roomId) || null;
  }

  async joinRoom(roomId: string, name: string, uid?: string): Promise<{ room: Room; participant: Participant } | null> {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const participantId = uid ? generatePseudonym(uid) : crypto.randomUUID();
    const participant: Participant = {
      id: participantId,
      type: 'human',
      name,
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

  async addMessage(roomId: string, participantId: string, content: MessageContent[]): Promise<Message | null> {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const message: Message = {
      id: crypto.randomUUID(),
      roomId,
      participantId,
      content,
      createdAt: new Date(),
    };

    room.messages.push(message);
    this.emitEvent(roomId, {
      type: 'message',
      data: message,
      timestamp: Date.now(),
    });

    return message;
  }

  async getMessages(roomId: string): Promise<Message[]> {
    const room = this.rooms.get(roomId);
    return room?.messages || [];
  }

  subscribe(roomId: string, listener: EventListener): () => void {
    if (!this.listeners.has(roomId)) {
      this.listeners.set(roomId, new Set());
    }
    this.listeners.get(roomId)!.add(listener);

    return () => {
      this.listeners.get(roomId)?.delete(listener);
    };
  }

  emitEvent(roomId: string, event: RoomEvent): void {
    this.listeners.get(roomId)?.forEach((listener) => listener(event));
  }

  getWaveAgent(): Participant {
    return WAVE_AGENT;
  }
}

class FirestoreStore {
  private listeners: Map<string, Set<EventListener>> = new Map();
  private unsubscribes: Map<string, Unsubscribe[]> = new Map();

  async createRoom(name: string, creatorName: string, creatorUid?: string): Promise<{ room: Room; participant: Participant }> {
    const db = getFirestoreDb();
    if (!db) throw new Error('Firestore not configured');

    const roomId = crypto.randomUUID();
    const participantId = creatorUid ? generatePseudonym(creatorUid) : crypto.randomUUID();

    const roomRef = doc(db, 'rooms', roomId);
    await setDoc(roomRef, {
      name,
      createdBy: participantId,
      createdAt: Timestamp.now(),
      status: 'active',
    });

    const creator: Participant = {
      id: participantId,
      type: 'human',
      name: creatorName,
      joinedAt: new Date(),
    };

    const participantsRef = collection(db, 'rooms', roomId, 'participants');
    await setDoc(doc(participantsRef, participantId), {
      type: 'human',
      name: creatorName,
      pseudonym: participantId,
      joinedAt: Timestamp.now(),
    });

    await setDoc(doc(participantsRef, WAVE_AGENT.id), {
      type: 'agent',
      name: WAVE_AGENT.name,
      pseudonym: WAVE_AGENT.id,
      joinedAt: Timestamp.now(),
    });

    const room: Room = {
      id: roomId,
      name,
      createdBy: participantId,
      participants: [creator, WAVE_AGENT],
      messages: [],
      createdAt: new Date(),
    };

    return { room, participant: creator };
  }

  async getRoom(roomId: string): Promise<Room | null> {
    const db = getFirestoreDb();
    if (!db) return null;

    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) return null;

    const roomData = roomSnap.data();
    const participantsSnap = await getDocs(collection(db, 'rooms', roomId, 'participants'));
    const messagesSnap = await getDocs(
      query(collection(db, 'rooms', roomId, 'messages'), orderBy('timestamp', 'asc'))
    );

    const participants: Participant[] = participantsSnap.docs.map((doc) => ({
      id: doc.id,
      type: doc.data().type,
      name: doc.data().name,
      joinedAt: doc.data().joinedAt?.toDate() || new Date(),
    }));

    const messages: Message[] = messagesSnap.docs.map((doc) => ({
      id: doc.id,
      roomId,
      participantId: doc.data().sender,
      content: doc.data().content,
      createdAt: doc.data().timestamp?.toDate() || new Date(),
    }));

    return {
      id: roomId,
      name: roomData.name,
      createdBy: roomData.createdBy,
      participants,
      messages,
      createdAt: roomData.createdAt?.toDate() || new Date(),
    };
  }

  async joinRoom(roomId: string, name: string, uid?: string): Promise<{ room: Room; participant: Participant } | null> {
    const db = getFirestoreDb();
    if (!db) return null;

    const room = await this.getRoom(roomId);
    if (!room) return null;

    const participantId = uid ? generatePseudonym(uid) : crypto.randomUUID();
    const participant: Participant = {
      id: participantId,
      type: 'human',
      name,
      joinedAt: new Date(),
    };

    const participantsRef = collection(db, 'rooms', roomId, 'participants');
    await setDoc(doc(participantsRef, participantId), {
      type: 'human',
      name,
      pseudonym: participantId,
      joinedAt: Timestamp.now(),
    });

    room.participants.push(participant);

    this.emitEvent(roomId, {
      type: 'participant_joined',
      data: participant,
      timestamp: Date.now(),
    });

    return { room, participant };
  }

  async addMessage(roomId: string, participantId: string, content: MessageContent[]): Promise<Message | null> {
    const db = getFirestoreDb();
    if (!db) return null;

    const messagesRef = collection(db, 'rooms', roomId, 'messages');
    const docRef = await addDoc(messagesRef, {
      content,
      sender: participantId,
      timestamp: Timestamp.now(),
      type: content[0]?.type || 'text',
    });

    const message: Message = {
      id: docRef.id,
      roomId,
      participantId,
      content,
      createdAt: new Date(),
    };

    this.emitEvent(roomId, {
      type: 'message',
      data: message,
      timestamp: Date.now(),
    });

    return message;
  }

  async getMessages(roomId: string): Promise<Message[]> {
    const db = getFirestoreDb();
    if (!db) return [];

    const messagesSnap = await getDocs(
      query(collection(db, 'rooms', roomId, 'messages'), orderBy('timestamp', 'asc'))
    );

    return messagesSnap.docs.map((doc) => ({
      id: doc.id,
      roomId,
      participantId: doc.data().sender,
      content: doc.data().content,
      createdAt: doc.data().timestamp?.toDate() || new Date(),
    }));
  }

  subscribe(roomId: string, listener: EventListener): () => void {
    if (!this.listeners.has(roomId)) {
      this.listeners.set(roomId, new Set());
    }
    this.listeners.get(roomId)!.add(listener);

    const db = getFirestoreDb();
    if (db) {
      const messagesRef = collection(db, 'rooms', roomId, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            const message: Message = {
              id: change.doc.id,
              roomId,
              participantId: data.sender,
              content: data.content,
              createdAt: data.timestamp?.toDate() || new Date(),
            };
            this.emitEvent(roomId, {
              type: 'message',
              data: message,
              timestamp: Date.now(),
            });
          }
        });
      });

      if (!this.unsubscribes.has(roomId)) {
        this.unsubscribes.set(roomId, []);
      }
      this.unsubscribes.get(roomId)!.push(unsubscribe);
    }

    return () => {
      this.listeners.get(roomId)?.delete(listener);
      if (this.listeners.get(roomId)?.size === 0) {
        this.unsubscribes.get(roomId)?.forEach((unsub) => unsub());
        this.unsubscribes.delete(roomId);
      }
    };
  }

  emitEvent(roomId: string, event: RoomEvent): void {
    this.listeners.get(roomId)?.forEach((listener) => listener(event));
  }

  getWaveAgent(): Participant {
    return WAVE_AGENT;
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __dbStore: InMemoryStore | FirestoreStore | undefined;
}

function getStore(): InMemoryStore | FirestoreStore {
  if (!global.__dbStore) {
    if (isFirebaseConfigured()) {
      console.log('[Wave] Using Firestore for persistence');
      global.__dbStore = new FirestoreStore();
    } else {
      console.log('[Wave] Using in-memory store (Firestore not configured)');
      global.__dbStore = new InMemoryStore();
    }
  }
  return global.__dbStore;
}

export const db = {
  createRoom: (name: string, creatorName: string, creatorUid?: string) =>
    getStore().createRoom(name, creatorName, creatorUid),
  getRoom: (roomId: string) => getStore().getRoom(roomId),
  joinRoom: (roomId: string, name: string, uid?: string) =>
    getStore().joinRoom(roomId, name, uid),
  addMessage: (roomId: string, participantId: string, content: MessageContent[]) =>
    getStore().addMessage(roomId, participantId, content),
  getMessages: (roomId: string) => getStore().getMessages(roomId),
  subscribe: (roomId: string, listener: EventListener) =>
    getStore().subscribe(roomId, listener),
  emitEvent: (roomId: string, event: RoomEvent) =>
    getStore().emitEvent(roomId, event),
  getWaveAgent: () => getStore().getWaveAgent(),
};
