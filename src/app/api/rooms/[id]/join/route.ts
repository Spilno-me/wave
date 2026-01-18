import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Participant name is required' },
        { status: 400 }
      );
    }

    const result = await db.joinRoom(id, name);

    if (!result) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      room: {
        id: result.room.id,
        name: result.room.name,
        participants: result.room.participants,
        createdAt: result.room.createdAt,
      },
      participant: result.participant,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to join room' },
      { status: 500 }
    );
  }
}
