import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { MessageContent } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { participantId, content } = body;

    if (!participantId || !content) {
      return NextResponse.json(
        { error: 'Participant ID and content are required' },
        { status: 400 }
      );
    }

    const room = await db.getRoom(id);
    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    const message = await db.addMessage(id, participantId, content);

    const waveAgent = db.getWaveAgent();

    db.emitEvent(id, {
      type: 'typing',
      data: { participantId: waveAgent.id },
      timestamp: Date.now(),
    });

    const allMessages = await db.getMessages(id);
    const conversationHistory = allMessages.map((m) => {
      const participant = room.participants.find((p) => p.id === m.participantId);
      const textContent = m.content
        .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
        .map((c) => c.text)
        .join(' ');
      return `${participant?.name || 'Unknown'}: ${textContent}`;
    }).join('\n');

    try {
      const result = streamText({
        model: anthropic('claude-sonnet-4-20250514'),
        system: `You are Wave, a helpful AI assistant in a collaborative workspace. You help teams work together on projects, answer questions, and provide suggestions. Keep responses concise and helpful. When appropriate, you can suggest actions that users might want to take.

If you want to suggest interactive actions, format them at the end of your response like this:
[BUTTONS]
View Details|view_details
Apply Changes|apply_changes
[/BUTTONS]

Only include buttons when they would be genuinely helpful for the user's workflow.`,
        prompt: `Here's the conversation so far:\n\n${conversationHistory}\n\nRespond as Wave to help the team.`,
      });

      let fullResponse = '';
      
      for await (const chunk of result.textStream) {
        fullResponse += chunk;
        db.emitEvent(id, {
          type: 'ai_streaming',
          data: { text: fullResponse, participantId: waveAgent.id },
          timestamp: Date.now(),
        });
      }

      const aiContent: MessageContent[] = [];
      let textPart = fullResponse;
      const buttonMatch = fullResponse.match(/\[BUTTONS\]([\s\S]*?)\[\/BUTTONS\]/);
      
      if (buttonMatch) {
        textPart = fullResponse.replace(/\[BUTTONS\][\s\S]*?\[\/BUTTONS\]/, '').trim();
        const buttonLines = buttonMatch[1].trim().split('\n');
        
        for (const line of buttonLines) {
          const [label, action] = line.split('|');
          if (label && action) {
            aiContent.push({ type: 'button', label: label.trim(), action: action.trim() });
          }
        }
      }

      aiContent.unshift({ type: 'text', text: textPart });

      await db.addMessage(id, waveAgent.id, aiContent);
    } catch (aiError) {
      console.error('AI error:', aiError);
      
      await db.addMessage(id, waveAgent.id, [
        { type: 'text', text: 'I apologize, but I encountered an error processing your request. Please try again.' }
      ]);
    }

    return NextResponse.json(message);
  } catch {
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
