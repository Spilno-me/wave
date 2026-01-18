import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, creatorName } = body;

    if (!name || !creatorName) {
      return NextResponse.json(
        { error: 'Room name and creator name are required' },
        { status: 400 }
      );
    }

    const { room, participant } = await db.createRoom(name, creatorName);

    return NextResponse.json({
      room: {
        id: room.id,
        name: room.name,
        participants: room.participants,
        createdAt: room.createdAt,
      },
      participant,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    );
  }
}
