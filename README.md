# Wave

Collaborative AI workspace — pattern memory for teams.

## What is Wave?

Wave is where teams work with AI. Not a chatbot — a collaborative space where:
- Multiple humans can join
- AI agents participate
- Patterns emerge and persist (via CEDA)
- Work produces real artifacts

## Stack

- Next.js 14 (App Router)
- Vercel AI SDK (streaming)
- Firebase Auth (Google Sign-In)
- Herald SDK (pattern memory)
- Railway (deployment)

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  WAVE                                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │    Auth     │     │    Chat     │     │   Patterns  │       │
│  │  (Firebase) │     │ (AI SDK)    │     │  (Herald)   │       │
│  └─────────────┘     └─────────────┘     └─────────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │      CEDA       │
                    │  Pattern Memory │
                    └─────────────────┘
```

## Related

- [CEDA](https://github.com/spilno/ceda) — Pattern memory cloud
- [Herald](https://github.com/spilno/herald) — Pattern SDK

---

*Wave — Where teams think together*
