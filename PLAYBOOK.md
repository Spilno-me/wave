# Wave Playbook

*Instructions for AI agents working on Wave*

---

## Project Context

Wave is a collaborative AI workspace where teams (humans + agents) work together. It's the business-facing interface to CEDA pattern memory.

**Repository**: github.com/Spilno-me/wave
**Deploy**: wave.getceda.com (Railway)
**Related**: CEDA (pattern storage), Herald (pattern SDK)

---

## ⚠️ MANDATORY: Herald Reflection Protocol

**You MUST call Herald at least once per task.** This is not optional.

### When to Call Herald

| Situation | Action | Tool |
|-----------|--------|------|
| **Stuck** (>15 min on same issue) | Capture the blocker | `herald_reflect` feeling=stuck |
| **Complex decision** (multiple valid approaches) | Get AI analysis | `herald_simulate` |
| **Success** (feature working, test passing) | Capture what worked | `herald_reflect` feeling=success |
| **Failure** (build broken, test failing) | Capture what failed | `herald_reflect` feeling=stuck |
| **Task complete** | Reflect on overall outcome | `herald_reflect` |

### Examples

```bash
# Stuck on streaming implementation
herald_reflect --session "wave-chat" --feeling stuck --insight "Vercel AI SDK streaming not working with Firebase auth middleware"

# Complex architecture decision
herald_simulate --session "wave-rooms" --feeling stuck --insight "Choosing between Firestore vs Postgres for room storage"

# Feature working
herald_reflect --session "wave-chat" --feeling success --insight "Streaming works by separating auth check from stream response"

# Task complete
herald_reflect --session "wave-mvp" --feeling success --insight "MVP complete: rooms, chat, streaming, Herald integration"
```

### Minimum Requirements

- [ ] **At least 1 Herald call per task** (mandatory)
- [ ] Call `herald_reflect` with feeling=stuck when blocked
- [ ] Call `herald_simulate` for complex decisions
- [ ] Call `herald_reflect` with feeling=success on completion

**DO NOT mark task complete without at least one Herald reflection.**

---

## Core Principles

### 1. Collaboration First
Wave is NOT single-user chat. It's a room where multiple participants work together.

```typescript
interface Room {
  id: string;
  participants: Participant[];  // humans AND agents
  messages: Message[];
}

interface Participant {
  id: string;
  type: 'human' | 'agent';
  name: string;
}
```

### 2. AI Fusion UX
Messages are rich media, not just text.

```typescript
type MessageContent =
  | { type: 'text'; text: string }
  | { type: 'artifact'; preview: string; actions: Action[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'image'; url: string }
  | { type: 'file'; name: string; url: string }
  | { type: 'button'; label: string; action: string };
```

### 3. Patterns Flow
Every significant action captures patterns to CEDA via Herald.

```typescript
// On session start
const patterns = await herald.patterns({ topic: roomTopic });

// On significant moment
await herald.reflect({
  session: roomId,
  feeling: 'success',
  insight: extractedInsight,
});
```

### 4. Compliance by Design
PII separated from operational data. See data architecture below.

---

## Tech Stack

```
MUST USE
├── Next.js 14 (App Router)
├── TypeScript (strict)
├── Vercel AI SDK (ai package)
├── @ai-sdk/anthropic
├── Firebase Auth
├── @ceda/herald-sdk
├── shadcn/ui
├── Tailwind CSS

DEPLOY TO
└── Railway (wave.getceda.com)
```

---

## Data Architecture

### Storage: Firestore (Wave's own persistence)

```
/rooms/{roomId}
  - name: string
  - topic: string
  - createdAt: timestamp
  - createdBy: string (pseudonym)
  - status: 'active' | 'archived'

/rooms/{roomId}/participants/{odId}
  - type: 'human' | 'agent'
  - name: string (display only)
  - pseudonym: string
  - joinedAt: timestamp

/rooms/{roomId}/messages/{messageId}
  - content: MessageContent (see types)
  - sender: string (pseudonym)
  - timestamp: timestamp
  - type: 'text' | 'artifact' | 'table' | 'image' | 'file'
```

### Separation Rule (GDPR/SOC2)

```
PII (Deletable)              Operational (Immutable)
─────────────────────────────────────────────────────
Firebase Auth only:          Firestore + Herald:
• Real name                  • user_abc123 (pseudonym)
• Email                      • Actions
• Phone                      • Messages (pseudonymized)
                             • Patterns (via Herald)
```

### Wave ↔ Herald (Decoupled)

Wave does NOT depend on CEDA. Herald is optional SDK integration.

```typescript
// Herald is fire-and-forget, not storage
import { herald } from '@ceda/herald-sdk';

// On significant moment (optional)
await herald.reflect({
  session: roomId,
  feeling: 'success',
  insight: 'User completed fire risk assessment',
});
```

### Pseudonym Generation

```typescript
import crypto from 'crypto';

function generatePseudonym(uid: string): string {
  const salt = process.env.PSEUDONYM_SALT!;
  return 'user_' + crypto
    .createHmac('sha256', salt)
    .update(uid)
    .digest('hex')
    .slice(0, 16);
}
```

### NEVER do this:

```typescript
// ❌ WRONG
await db.messages.create({
  userEmail: 'john@example.com',  // NO PII in messages
});

// ✅ CORRECT
await db.messages.create({
  userPseudonym: 'user_abc123',
});
```

---

## UI Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  WAVE  [Room Name]                    [Participants] [+ Invite] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Messages (scrollable)                                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Sarah: Let's work on the fire risk module               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Wave (AI): Based on patterns, I suggest PAS 79...       │   │
│  │                                                          │   │
│  │ [View BPMN]  [Apply]  [Edit]                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Wave is typing...                                              │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  [Type message...]                                      [Send]  │
├─────────────────────────────────────────────────────────────────┤
│  💡 Patterns: 47 similar | 94% success rate                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Routes

```
POST   /api/rooms              Create room
GET    /api/rooms/[id]         Get room
POST   /api/rooms/[id]/join    Join room
POST   /api/rooms/[id]/chat    Send message (streaming)
GET    /api/rooms/[id]/messages  Get messages
```

---

## Environment Variables

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=

# AI
ANTHROPIC_API_KEY=

# Herald/CEDA
HERALD_API_KEY=
CEDA_API_URL=https://api.getceda.com

# Security
PSEUDONYM_SALT=

# Optional
RAILWAY_URL=
```

---

## File Structure

```
wave/
├── app/
│   ├── api/
│   │   ├── rooms/
│   │   │   ├── route.ts           # Create room
│   │   │   └── [id]/
│   │   │       ├── route.ts       # Get room
│   │   │       ├── join/route.ts  # Join room
│   │   │       └── chat/route.ts  # Send message
│   │   └── auth/
│   │       └── route.ts           # Auth helpers
│   ├── room/
│   │   └── [id]/
│   │       └── page.tsx           # Room view
│   ├── layout.tsx
│   └── page.tsx                   # Landing/create room
├── components/
│   ├── chat/
│   │   ├── MessageList.tsx
│   │   ├── MessageContent.tsx
│   │   ├── ChatInput.tsx
│   │   └── TypingIndicator.tsx
│   ├── room/
│   │   ├── ParticipantList.tsx
│   │   └── InviteButton.tsx
│   └── ui/                        # shadcn components
├── lib/
│   ├── firebase.ts
│   ├── herald.ts
│   ├── pseudonym.ts
│   └── db.ts
├── types/
│   └── index.ts
└── public/
```

---

## Quality Checklist

Before PR:
- [ ] TypeScript strict mode passes
- [ ] No PII in operational stores
- [ ] Streaming works
- [ ] Mobile responsive
- [ ] Herald integration tested
- [ ] Error handling in place
- [ ] **Herald reflection called at least once** (MANDATORY)

---

## Commands

```bash
# Development
npm run dev

# Build
npm run build

# Type check
npm run typecheck

# Lint
npm run lint

# Deploy (Railway auto-deploys from main)
git push origin main
```

---

*Wave Playbook v1.0*
