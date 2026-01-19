import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: `You are a helpful assistant in Wave, CEDA's collaborative workspace.

You help enterprise teams with:
- HSE compliance and module creation
- Business workflow optimization
- Document drafting and review
- Technical planning and architecture

Be concise, professional, and focused on actionable outcomes.
Use clear structure with bullet points when listing items.
Ask clarifying questions when the task scope is unclear.`,
    messages,
  });

  return result.toDataStreamResponse();
}
