# Classical Music Trivia

A mobile-first, real-time trivia game for classical music enthusiasts. Built with Next.js, Convex, and Tailwind CSS.

## Features

- **Real-time gameplay** - Live updates powered by Convex
- **Mobile-first design** - Optimized for players on phones
- **Host dashboard** - Control game flow, view submissions, grade answers
- **Lobby display** - Big-screen scoreboard for venues
- **Auto-grading** - Smart answer matching with manual review queue
- **Multiple question types** - Text, multiple choice, numeric, and media questions

## Tech Stack

- **Frontend**: Next.js 15 (App Router) + React 19 + TypeScript
- **Backend**: Convex (real-time database)
- **Styling**: Tailwind CSS + shadcn/ui
- **Deployment**: Vercel + Convex Cloud

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Convex account (free at [convex.dev](https://convex.dev))

### Setup

1. **Install dependencies**

```bash
npm install
```

2. **Configure Convex**

```bash
npx convex dev
```

This will prompt you to log in to Convex and create a new project. It will automatically:
- Create a `.env.local` file with your `NEXT_PUBLIC_CONVEX_URL`
- Deploy your schema and functions

3. **Start development**

```bash
npm run dev
```

This runs both Next.js and Convex dev servers in parallel.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js + Convex dev servers |
| `npm run dev:next` | Start only Next.js |
| `npm run dev:convex` | Start only Convex |
| `npm run build` | Build for production |
| `npm run typecheck` | Run TypeScript checks |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── join/              # Team join page
│   ├── play/[gameCode]/   # Player game view
│   ├── host/              # Host pages
│   │   ├── new/           # Create new game
│   │   └── [gameId]/      # Host dashboard
│   ├── lobby/[gameCode]/  # Big-screen display
│   └── media/[gameCode]/  # Auxiliary media view
├── components/
│   ├── game/              # Player-facing components
│   ├── host/              # Host dashboard components
│   ├── lobby/             # Lobby display components
│   ├── shared/            # Shared utilities
│   └── ui/                # shadcn/ui components
├── lib/                   # Utilities
└── providers/             # React context providers

convex/
├── schema.ts              # Database schema
├── games.ts               # Game queries/mutations
├── teams.ts               # Team queries/mutations
├── rounds.ts              # Round queries/mutations
├── questions.ts           # Question queries/mutations
├── answers.ts             # Answer queries/mutations
└── scoring.ts             # Grading logic
```

## Game Flow

1. **Host creates a game** → Gets a 6-character join code
2. **Teams join** via the join page with the code
3. **Host starts the game** → Players see questions in real-time
4. **Players submit answers** → Host sees submission status
5. **Host closes submissions** → Auto-grading runs
6. **Host reviews flagged answers** → Manual approve/reject
7. **Host advances** → Next question or round
8. **Game ends** → Final standings shown

## Views

| Route | Purpose |
|-------|---------|
| `/` | Landing page |
| `/join` | Team join form |
| `/play/[gameCode]` | Player game interface |
| `/host/new` | Create new game |
| `/host/[gameId]` | Host dashboard |
| `/lobby/[gameCode]` | Big-screen scoreboard |
| `/media/[gameCode]` | Auxiliary media display |

## Deployment

### Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variable: `NEXT_PUBLIC_CONVEX_URL`

### Convex

```bash
npx convex deploy
```

## License

MIT
