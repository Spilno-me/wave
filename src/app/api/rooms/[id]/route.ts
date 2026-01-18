import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const room = await db.getRoom(id);

  if (!room) {
    return NextResponse.json(
      { error: 'Room not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    id: room.id,
    name: room.name,
    participants: room.participants,
    messageCount: room.messages.length,
    createdAt: room.createdAt,
  });
}
