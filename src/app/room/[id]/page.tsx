'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageList } from '@/components/chat/MessageList';
import { ChatInput } from '@/components/chat/ChatInput';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { ParticipantList } from '@/components/room/ParticipantList';
import { InviteButton } from '@/components/room/InviteButton';
import { Room, Participant, Message, RoomEvent } from '@/types';
import { Plus } from 'lucide-react';

interface StreamingMessage {
  participantId: string;
  text: string;
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [typingParticipants, setTypingParticipants] = useState<string[]>([]);
  const [streamingMessage, setStreamingMessage] = useState<StreamingMessage | null>(null);
  const [joinName, setJoinName] = useState('');
  const [needsJoin, setNeedsJoin] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage, scrollToBottom]);

  useEffect(() => {
    const storedParticipant = sessionStorage.getItem(`participant-${roomId}`);
    
    const fetchRoom = async () => {
      try {
        const response = await fetch(`/api/rooms/${roomId}`);
        if (!response.ok) {
          router.push('/');
          return;
        }
        const roomData = await response.json();
        setRoom(roomData);

        if (storedParticipant) {
          const parsed = JSON.parse(storedParticipant);
          setParticipant(parsed);
          
          const messagesResponse = await fetch(`/api/rooms/${roomId}/messages`);
          if (messagesResponse.ok) {
            const messagesData = await messagesResponse.json();
            setMessages(messagesData);
          }
        } else {
          setNeedsJoin(true);
        }
      } catch {
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoom();
  }, [roomId, router]);

  useEffect(() => {
    if (!participant || !roomId) return;

    const eventSource = new EventSource(`/api/rooms/${roomId}/events`);

    eventSource.onmessage = (event) => {
      const data: RoomEvent = JSON.parse(event.data);

      switch (data.type) {
        case 'message':
          setMessages((prev) => {
            const newMessage = data.data as Message;
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
          setStreamingMessage(null);
          break;
        case 'participant_joined':
          setRoom((prev) => {
            if (!prev) return prev;
            const newParticipant = data.data as Participant;
            if (prev.participants.some((p) => p.id === newParticipant.id)) return prev;
            return {
              ...prev,
              participants: [...prev.participants, newParticipant],
            };
          });
          break;
        case 'typing':
          const typingData = data.data as { participantId: string };
          if (typingData.participantId !== participant.id) {
            setTypingParticipants((prev) => {
              if (prev.includes(typingData.participantId)) return prev;
              return [...prev, typingData.participantId];
            });
            setTimeout(() => {
              setTypingParticipants((prev) =>
                prev.filter((id) => id !== typingData.participantId)
              );
            }, 3000);
          }
          break;
        case 'ai_streaming':
          const streamData = data.data as { text: string; participantId: string };
          setStreamingMessage(streamData);
          break;
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [participant, roomId]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinName.trim()) return;

    try {
      const response = await fetch(`/api/rooms/${roomId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: joinName.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setParticipant(data.participant);
        setRoom(data.room);
        sessionStorage.setItem(`participant-${roomId}`, JSON.stringify(data.participant));
        setNeedsJoin(false);

        const messagesResponse = await fetch(`/api/rooms/${roomId}/messages`);
        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json();
          setMessages(messagesData);
        }
      }
    } catch (error) {
      console.error('Failed to join room:', error);
    }
  };

  const handleSendMessage = async (messageText: string) => {
    if (!participant || isSending) return;

    setIsSending(true);

    try {
      await fetch(`/api/rooms/${roomId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: participant.id,
          content: [{ type: 'text', text: messageText }],
        }),
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleButtonAction = (action: string) => {
    console.log('Button action:', action);
  };

  const getParticipantById = (id: string): Participant | undefined => {
    return room?.participants.find((p) => p.id === id);
  };

  const typingNames = typingParticipants
    .map((id) => getParticipantById(id)?.name)
    .filter((name): name is string => !!name);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-950">
        <div className="text-neutral-400">Loading...</div>
      </div>
    );
  }

  if (needsJoin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-950">
        <div className="w-full max-w-md p-8">
          <h1 className="text-2xl font-bold text-white mb-2">Join Room</h1>
          <p className="text-neutral-400 mb-6">
            Enter your name to join &quot;{room?.name}&quot;
          </p>
          <form onSubmit={handleJoin} className="space-y-4">
            <Input
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
              placeholder="Your name"
              className="bg-neutral-900 border-neutral-800 text-white"
              autoFocus
            />
            <Button type="submit" className="w-full" disabled={!joinName.trim()}>
              Join Room
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-neutral-950">
      <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-white">WAVE</h1>
          <span className="text-neutral-400">{room?.name}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {room?.participants
              .filter((p) => p.type === 'human')
              .slice(0, 3)
              .map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-1 text-sm text-neutral-300"
                >
                  <span>@{p.name}</span>
                </div>
              ))}
            {(room?.participants.filter((p) => p.type === 'human').length || 0) > 3 && (
              <span className="text-sm text-neutral-500">
                +{(room?.participants.filter((p) => p.type === 'human').length || 0) - 3}
              </span>
            )}
          </div>
          <InviteButton />
          <Button
            variant="ghost"
            size="icon"
            className="text-neutral-400 hover:text-white"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              <MessageList
                messages={messages}
                participants={room?.participants || []}
                streamingMessage={streamingMessage}
                onButtonAction={handleButtonAction}
              />

              {typingNames.length > 0 && !streamingMessage && (
                <div className="mt-4">
                  <TypingIndicator names={typingNames} />
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-neutral-800">
            <div className="max-w-4xl mx-auto">
              <ChatInput
                onSendMessage={handleSendMessage}
                disabled={isSending}
              />
            </div>
          </div>
        </main>

        <aside className="w-64 border-l border-neutral-800 p-4 hidden lg:block">
          <h2 className="text-sm font-medium text-neutral-400 mb-4">Participants</h2>
          <ParticipantList participants={room?.participants || []} />
        </aside>
      </div>
    </div>
  );
}
