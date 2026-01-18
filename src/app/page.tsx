'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [roomName, setRoomName] = useState('');
  const [userName, setUserName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim() || !userName.trim()) return;

    setIsCreating(true);

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roomName.trim(),
          creatorName: userName.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        sessionStorage.setItem(
          `participant-${data.room.id}`,
          JSON.stringify(data.participant)
        );
        router.push(`/room/${data.room.id}`);
      }
    } catch (error) {
      console.error('Failed to create room:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-neutral-950">
      <div className="w-full max-w-md p-8">
        <div className="flex items-center gap-3 mb-8">
          <MessageSquare className="w-10 h-10 text-blue-500" />
          <h1 className="text-3xl font-bold text-white">WAVE</h1>
        </div>

        <p className="text-neutral-400 mb-8">
          Create a collaborative workspace where humans and AI work together in real-time.
        </p>

        <form onSubmit={handleCreateRoom} className="space-y-4">
          <div>
            <label htmlFor="roomName" className="block text-sm font-medium text-neutral-300 mb-2">
              Room Name
            </label>
            <Input
              id="roomName"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="e.g., Project Planning"
              className="bg-neutral-900 border-neutral-800 text-white"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="userName" className="block text-sm font-medium text-neutral-300 mb-2">
              Your Name
            </label>
            <Input
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="e.g., Sarah"
              className="bg-neutral-900 border-neutral-800 text-white"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!roomName.trim() || !userName.trim() || isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Room'}
          </Button>
        </form>

        <p className="text-neutral-500 text-sm mt-8 text-center">
          Wave AI assistant will automatically join your room
        </p>
      </div>
    </div>
  );
}
