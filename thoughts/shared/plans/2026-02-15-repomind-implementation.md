# RepoMind Implementation Plan

## Overview

RepoMind is an intelligent codebase understanding tool that leverages Claude Opus 4.6's 1M context window and adaptive thinking to provide architectural insights, natural language Q&A, and auto-generated architecture diagrams for any GitHub repository. Built for the "Built with Opus 4.6" hackathon (Cerebral Valley + Anthropic).

**Tagline:** "Understand any codebase in seconds, not weeks"

## Current State Analysis

- Greenfield project — no existing code beyond a README
- PROJECT_DIR: `/home/ccx/projects/cv-hackathon-2026`
- GitHub org: `X-Arc-ai` (https://github.com/orgs/X-Arc-ai)
- System has Node 20.20.0, npm 10.8.2, gh CLI 2.86.0, git 2.43.0
- Anthropic API key available via `ANTHROPIC_API_KEY` env var

### Key Technical Discoveries:

- **Opus 4.6 1M context**: Requires `betas: ["context-1m-2025-08-07"]` via `client.beta.messages.create()`. Premium pricing applies when exceeding 200K input tokens
- **Adaptive thinking**: Use `thinking: { type: "adaptive" }` with `output_config: { effort: "high" | "max" }` — replaces deprecated `budget_tokens`
- **Streaming**: Two approaches — `stream: true` (low-level SSE) or `.stream()` (high-level with event handlers). Use `content_block_delta` events with `text_delta` and `thinking_delta` types
- **Token counting**: Free `client.messages.countTokens()` API for pre-flight checks
- **React Flow**: `@xyflow/react` with dagre for auto-layout. Needs `'use client'` directive in Next.js. CSS import required: `@xyflow/react/dist/style.css`
- **shadcn/ui**: Tailwind v4 uses CSS-first config with `@import "tailwindcss"` and `tw-animate-css`. Components installed via `npx shadcn-ui@latest add`
- **Next.js SSE**: Route handlers with `ReadableStream`, `Content-Type: text/event-stream`, and `export const dynamic = 'force-dynamic'`

## Desired End State

A deployed web application at `repomind.dev` (or via Vercel preview URL) where:

1. User enters a GitHub repo URL or selects a pre-loaded repo
2. RepoMind ingests the codebase, showing a real-time token counter
3. User asks natural language questions and gets streaming answers with code references
4. Architecture diagrams are auto-generated as interactive React Flow graphs
5. Adaptive thinking is visualized in the UI (collapsible "thinking" section)
6. The UI is polished, dark-mode, and impressive for a demo

### Verification:
- Demo with pre-loaded React repo answers "How does the reconciliation algorithm work?" with specific file:line references
- Architecture diagram renders module dependencies as an interactive graph
- Streaming responses show thinking indicator and text simultaneously
- Token counter shows ingestion progress
- Works on desktop and mobile viewports

## What We're NOT Doing

- **No vector DB / embeddings** — we use the 1M context window directly (this IS the differentiator)
- **No user auth** — open demo, no accounts
- **No persistent storage** — sessions are ephemeral, repos cached temporarily on disk
- **No Tree-sitter AST parsing** — file content + directory structure is sufficient for the 1M context approach
- **No Agent Teams** — single-agent Q&A is more reliable for demo
- **No custom domain setup** — Vercel preview URL is fine for hackathon
- **No onboarding guide generation** — focus on Q&A + diagrams (core differentiators)

## Implementation Approach

**Architecture:** Single Next.js 15 App Router application. Frontend + API in one project.

**Core flow:**
1. User provides GitHub URL → API clones repo (shallow) into temp dir
2. Server builds a "context document" from the repo: file tree, key files (sorted by importance), README, package.json, etc.
3. Context document is sent to Opus 4.6 with 1M context window
4. User queries stream through SSE from a Next.js route handler
5. Architecture diagram requests return structured JSON that React Flow renders

**Key design decisions:**
- **No chunking/RAG** — the whole point is to showcase 1M context. We send the entire repo context in every request
- **Smart file prioritization** — README, config files, entry points first, then source files sorted by import frequency, tests last
- **Pre-loaded repos cached on disk** — React, Express, Next.js cloned at build time for instant demos
- **SSE for streaming** — Next.js route handler → Anthropic streaming API → SSE to browser

---

## Phase 1: Project Scaffolding & GitHub Setup

### Overview
Set up the Next.js project with all dependencies, configure shadcn/ui with dark mode, create the GitHub repo under X-Arc-ai org, and establish the project structure.

### Changes Required:

#### 1. Create GitHub Repo
```bash
gh repo create X-Arc-ai/repomind --public --description "Understand any codebase in seconds, not weeks. Powered by Claude Opus 4.6." --clone
```

#### 2. Initialize Next.js Project
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

#### 3. Install Dependencies
```bash
# Core
npm install @anthropic-ai/sdk @xyflow/react @dagrejs/dagre

# UI
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card tabs input scroll-area skeleton badge dialog textarea separator

# Dark mode + animations
npm install next-themes lucide-react
npm install -D tw-animate-css

# Utilities
npm install simple-git clsx
```

#### 4. Project Structure
```
src/
├── app/
│   ├── layout.tsx              # Root layout with ThemeProvider
│   ├── page.tsx                # Landing/home page
│   ├── globals.css             # Tailwind v4 + shadcn theme
│   ├── explore/
│   │   └── page.tsx            # Main exploration UI
│   └── api/
│       ├── ingest/
│       │   └── route.ts        # POST: clone repo, build context, return metadata
│       ├── query/
│       │   └── route.ts        # POST: SSE streaming Q&A
│       ├── diagram/
│       │   └── route.ts        # POST: generate architecture diagram JSON
│       └── count-tokens/
│           └── route.ts        # POST: count tokens for a repo context
├── components/
│   ├── ui/                     # shadcn components (auto-generated)
│   ├── theme-provider.tsx      # next-themes provider
│   ├── theme-toggle.tsx        # dark/light toggle button
│   ├── repo-input.tsx          # GitHub URL input + pre-loaded repo selector
│   ├── chat-interface.tsx      # Q&A chat with streaming
│   ├── message-bubble.tsx      # Individual message with thinking toggle
│   ├── thinking-indicator.tsx  # Animated thinking visualization
│   ├── token-counter.tsx       # Real-time token ingestion counter
│   ├── architecture-diagram.tsx # React Flow diagram wrapper
│   ├── diagram-node.tsx        # Custom React Flow node (module/file)
│   ├── diagram-edge.tsx        # Custom React Flow edge (dependency)
│   ├── code-reference.tsx      # Inline code reference with file:line
│   └── header.tsx              # App header with logo + theme toggle
├── lib/
│   ├── anthropic.ts            # Anthropic client singleton
│   ├── repo-ingester.ts        # Clone repo, build context document
│   ├── context-builder.ts      # Build prioritized context from repo files
│   ├── file-prioritizer.ts     # Score and sort files by importance
│   ├── prompts.ts              # System prompts for Q&A and diagram generation
│   └── utils.ts                # cn() helper + misc utilities
└── types/
    └── index.ts                # Shared TypeScript types
```

#### 5. Configure Dark Mode + Tailwind v4

**`src/app/globals.css`:**
```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-sm: var(--radius);
  --font-family-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --font-family-mono: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
}

:root {
  --background: oklch(0.985 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --primary: oklch(0.35 0.15 270);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.96 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.96 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.96 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.35 0.15 270);
  --radius: 0.625rem;
}

.dark {
  --background: oklch(0.12 0.01 270);
  --foreground: oklch(0.93 0 0);
  --card: oklch(0.16 0.01 270);
  --card-foreground: oklch(0.93 0 0);
  --primary: oklch(0.65 0.2 270);
  --primary-foreground: oklch(0.12 0 0);
  --secondary: oklch(0.22 0.01 270);
  --secondary-foreground: oklch(0.93 0 0);
  --muted: oklch(0.22 0.01 270);
  --muted-foreground: oklch(0.6 0 0);
  --accent: oklch(0.22 0.01 270);
  --accent-foreground: oklch(0.93 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.28 0.01 270);
  --input: oklch(0.28 0.01 270);
  --ring: oklch(0.65 0.2 270);
}
```

**`src/components/theme-provider.tsx`:**
```tsx
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

#### 6. Environment Variables

**`.env.local`:**
```
ANTHROPIC_API_KEY=<key>
REPO_CACHE_DIR=/tmp/repomind-repos
```

### Success Criteria:

#### Automated Verification:
- [ ] `npm run build` completes without errors
- [ ] `npm run lint` passes
- [ ] `npm run dev` starts on localhost:3000
- [ ] Dark mode toggle switches themes
- [ ] GitHub repo exists at https://github.com/X-Arc-ai/repomind

#### Manual Verification:
- [ ] Home page renders with header, theme toggle, and basic layout
- [ ] Dark mode looks correct (no flash of unstyled content)

---

## Phase 2: Codebase Ingestion Engine

### Overview
Build the server-side logic to clone GitHub repos, analyze file structure, and build a prioritized context document that fits within the 1M token window. This is the core engine that makes RepoMind work.

### Changes Required:

#### 1. Type Definitions (`src/types/index.ts`)
```typescript
export interface RepoMetadata {
  name: string
  owner: string
  url: string
  defaultBranch: string
  fileCount: number
  totalTokens: number
  languages: Record<string, number>  // language -> file count
  topFiles: string[]                 // most important files
}

export interface FileEntry {
  path: string
  content: string
  language: string
  size: number
  priority: number  // 0 = highest priority
}

export interface IngestResponse {
  sessionId: string
  metadata: RepoMetadata
  tokenCount: number
  truncated: boolean
  filesIncluded: number
  filesTotal: number
}

export interface QueryRequest {
  sessionId: string
  query: string
  effort?: "low" | "medium" | "high" | "max"
}

export interface DiagramRequest {
  sessionId: string
  focus?: string  // specific area to diagram
}

export interface DiagramNode {
  id: string
  label: string
  type: "module" | "component" | "util" | "config" | "test" | "entry"
  description: string
  filePath?: string
}

export interface DiagramEdge {
  source: string
  target: string
  label?: string
  type: "imports" | "extends" | "uses" | "configures"
}

export interface DiagramData {
  nodes: DiagramNode[]
  edges: DiagramEdge[]
  title: string
  description: string
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  thinking?: string
  codeRefs?: CodeReference[]
  timestamp: number
}

export interface CodeReference {
  file: string
  line?: number
  snippet?: string
}
```

#### 2. File Prioritizer (`src/lib/file-prioritizer.ts`)

Scores files by importance for context building. Priority order:
1. README, CONTRIBUTING, ARCHITECTURE docs
2. Package manifests (package.json, Cargo.toml, go.mod, etc.)
3. Config files (tsconfig, webpack, vite, next.config, etc.)
4. Entry points (index.ts, main.ts, app.ts, etc.)
5. Source files sorted by import frequency (most imported = most important)
6. Test files (lowest priority — include if space allows)

Logic:
- Parse file tree to identify language
- Score each file based on name patterns, directory depth, and extension
- Files in `node_modules/`, `.git/`, `dist/`, `build/` are excluded entirely
- Binary files are excluded
- Files over 50KB are truncated with a note

#### 3. Context Builder (`src/lib/context-builder.ts`)

Builds a structured context document from the repo files:

```
# Repository: {owner}/{name}
## File Structure
{tree output — full directory tree}

## Key Files

### {file.path}
```{language}
{file.content}
```

[... repeated for each file in priority order until token budget is reached ...]
```

Logic:
- Generates full directory tree (always included, ~500-2000 tokens)
- Iterates through files in priority order
- Uses a conservative token estimate (4 chars ≈ 1 token) for fast pre-flight
- Calls `countTokens()` API once at the end for accurate count
- Target: fill up to 800K tokens of context (leaving 200K for system prompt + response)
- Returns the context string + metadata

#### 4. Repo Ingester (`src/lib/repo-ingester.ts`)

Handles the full ingestion pipeline:
- Validate GitHub URL format
- Check if repo is already cached (by owner/name)
- Shallow clone (`--depth 1`) into `REPO_CACHE_DIR/{owner}/{name}`
- Walk file tree, apply exclusions
- Score and sort files via prioritizer
- Build context document via context builder
- Store context in memory (Map keyed by sessionId)
- Return metadata + token count

Session storage: In-memory `Map<string, { context: string, metadata: RepoMetadata, createdAt: number }>` with 1-hour TTL cleanup.

#### 5. Anthropic Client (`src/lib/anthropic.ts`)

```typescript
import Anthropic from "@anthropic-ai/sdk"

export const anthropic = new Anthropic()

// Session context storage
const sessions = new Map<string, {
  context: string
  metadata: RepoMetadata
  messages: Array<{ role: "user" | "assistant", content: string }>
  createdAt: number
}>()

export function getSession(sessionId: string) { ... }
export function setSession(sessionId: string, data: ...) { ... }

// Cleanup stale sessions every 10 minutes
setInterval(() => {
  const now = Date.now()
  for (const [id, session] of sessions) {
    if (now - session.createdAt > 3600000) sessions.delete(id)
  }
}, 600000)
```

#### 6. API Route: Ingest (`src/app/api/ingest/route.ts`)

```typescript
// POST /api/ingest
// Body: { url: string } or { preloaded: "react" | "express" | "nextjs" }
// Response: IngestResponse

export const dynamic = 'force-dynamic'
export const maxDuration = 60  // allow up to 60s for large repos

export async function POST(req: Request) {
  const { url, preloaded } = await req.json()

  // Resolve repo source
  // Clone or use cached
  // Build context
  // Store session
  // Return metadata
}
```

### Pre-loaded Repos

Clone these at first deploy / build time:
- **react** — `facebook/react` (large, impressive for demo)
- **express** — `expressjs/express` (medium, well-known)
- **next.js** — `vercel/next.js` (very large — may need to subset to `packages/next/`)

Store pre-built context documents for instant load.

### Success Criteria:

#### Automated Verification:
- [ ] `POST /api/ingest` with `{ "url": "https://github.com/expressjs/express" }` returns valid `IngestResponse` with `tokenCount > 0`
- [ ] `POST /api/ingest` with `{ "preloaded": "express" }` returns instantly (cached)
- [ ] Token count matches expected range for express (~50K-150K tokens)
- [ ] `npm run build` completes without errors

#### Manual Verification:
- [ ] Large repos (React) are properly truncated to fit 800K token budget
- [ ] File priority ordering makes sense (README first, tests last)
- [ ] Binary files and node_modules are excluded

---

## Phase 3: Q&A Streaming Interface

### Overview
Build the core Q&A experience: user asks a question about the codebase, Claude Opus 4.6 streams a response with adaptive thinking visible in the UI. This is the hero feature.

### Changes Required:

#### 1. System Prompts (`src/lib/prompts.ts`)

```typescript
export const QA_SYSTEM_PROMPT = `You are RepoMind, an expert codebase analyst powered by Claude Opus 4.6. You have the entire codebase loaded in your context window.

Your job is to answer questions about this codebase with precision, depth, and specific code references.

When answering:
- Reference specific files and line numbers: \`src/utils/auth.ts:42\`
- Quote relevant code snippets using fenced code blocks
- Explain architectural decisions and patterns you observe
- When asked "why", reason from code patterns, commit messages, and naming conventions
- Be direct and technical — the user is a developer

Format guidelines:
- Use markdown for structure (headers, lists, code blocks)
- Keep answers focused and specific — don't over-explain obvious things
- Include file:line references for every claim about the code
- If something is ambiguous, say so and explain the possibilities

The codebase context follows below.
`

export const DIAGRAM_SYSTEM_PROMPT = `You are RepoMind, an expert codebase analyst. Generate an architecture diagram of the codebase as a JSON structure.

Return ONLY valid JSON matching this schema:
{
  "title": "string - diagram title",
  "description": "string - brief description of what the diagram shows",
  "nodes": [
    {
      "id": "string - unique identifier",
      "label": "string - display name",
      "type": "module | component | util | config | test | entry",
      "description": "string - brief description"
    }
  ],
  "edges": [
    {
      "source": "string - source node id",
      "target": "string - target node id",
      "label": "string - relationship description",
      "type": "imports | extends | uses | configures"
    }
  ]
}

Guidelines:
- Focus on the most important modules/components (10-25 nodes max)
- Show the key architectural relationships
- Group related files into logical modules (don't show every file)
- Use clear, concise labels
- The diagram should tell the story of how the codebase is organized
`
```

#### 2. API Route: Query (`src/app/api/query/route.ts`)

Streaming SSE endpoint:

```typescript
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const { sessionId, query, effort = "high" } = await req.json()

  const session = getSession(sessionId)
  if (!session) return new Response("Session not found", { status: 404 })

  // Build messages array with conversation history
  const messages = [
    ...session.messages,
    { role: "user" as const, content: query }
  ]

  // Stream from Anthropic
  const stream = anthropic.messages.stream({
    model: "claude-opus-4-6",
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: { effort },
    system: QA_SYSTEM_PROMPT + "\n\n" + session.context,
    messages,
  })

  // Relay as SSE
  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (event.type === "content_block_start") {
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: "block_start", blockType: event.content_block.type })}\n\n`
          ))
        } else if (event.type === "content_block_delta") {
          if (event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(
              `data: ${JSON.stringify({ type: "text", text: event.delta.text })}\n\n`
            ))
          } else if (event.delta.type === "thinking_delta") {
            controller.enqueue(encoder.encode(
              `data: ${JSON.stringify({ type: "thinking", text: event.delta.thinking })}\n\n`
            ))
          }
        }
      }

      const finalMessage = await stream.finalMessage()
      controller.enqueue(encoder.encode(
        `data: ${JSON.stringify({ type: "done", usage: finalMessage.usage })}\n\n`
      ))
      controller.close()

      // Update conversation history
      const assistantText = finalMessage.content
        .filter(b => b.type === "text")
        .map(b => b.text)
        .join("")
      session.messages.push(
        { role: "user", content: query },
        { role: "assistant", content: assistantText }
      )
    }
  })

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
```

**Note on 1M context:** If the session context exceeds 200K tokens, we need the beta endpoint:
```typescript
// For repos > 200K tokens, use beta endpoint
if (session.tokenCount > 200000) {
  // Use client.beta.messages with betas: ["context-1m-2025-08-07"]
  // Streaming approach is the same, just different client method
}
```

#### 3. Chat Interface Component (`src/components/chat-interface.tsx`)

Client component that:
- Renders conversation history
- Shows input textarea at bottom
- On submit: POST to `/api/query`, consume SSE stream
- Display thinking blocks in collapsible section with pulsing animation
- Display text blocks with markdown rendering
- Auto-scroll to latest message
- Show token usage after each response

Uses: `useState` for messages, `useRef` for scroll, `EventSource` pattern for SSE consumption (or `fetch` + `ReadableStream` reader for POST requests).

For consuming POST SSE (since EventSource only supports GET):
```typescript
const response = await fetch("/api/query", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ sessionId, query }),
})

const reader = response.body!.getReader()
const decoder = new TextDecoder()

while (true) {
  const { done, value } = await reader.read()
  if (done) break

  const chunk = decoder.decode(value)
  const lines = chunk.split("\n")
  for (const line of lines) {
    if (line.startsWith("data: ")) {
      const data = JSON.parse(line.slice(6))
      // Handle data.type: "thinking" | "text" | "done"
    }
  }
}
```

#### 4. Thinking Indicator Component (`src/components/thinking-indicator.tsx`)

Visual indicator that shows:
- Animated brain/sparkle icon when thinking is active
- Collapsible thinking text (dimmed, monospace)
- Smooth transition between thinking and response
- "Thinking..." label with animated dots

#### 5. Message Bubble Component (`src/components/message-bubble.tsx`)

- User messages: right-aligned, primary color
- Assistant messages: left-aligned, card background
- Markdown rendering for assistant messages (use `react-markdown` + `rehype-highlight` for syntax highlighting)
- Thinking section: collapsible above the main response
- Code references rendered as clickable badges

**Additional dependency:**
```bash
npm install react-markdown rehype-highlight remark-gfm
```

### Success Criteria:

#### Automated Verification:
- [ ] `POST /api/query` with valid session returns SSE stream
- [ ] Stream contains `thinking` and `text` events
- [ ] Stream ends with `done` event containing usage data
- [ ] `npm run build` passes

#### Manual Verification:
- [ ] Asking "What does this codebase do?" returns a coherent answer about the loaded repo
- [ ] Code references (file:line) are present in answers
- [ ] Thinking indicator animates during reasoning
- [ ] Thinking text is visible in collapsible section
- [ ] Conversation history is maintained (follow-up questions work)
- [ ] Streaming feels smooth (no visible chunking artifacts)

---

## Phase 4: Architecture Diagram Generation

### Overview
Generate interactive architecture diagrams using Claude to analyze the codebase structure and React Flow to render the visualization. Claude outputs structured JSON, which gets rendered as an auto-layouted graph.

### Changes Required:

#### 1. API Route: Diagram (`src/app/api/diagram/route.ts`)

```typescript
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const { sessionId, focus } = await req.json()

  const session = getSession(sessionId)
  if (!session) return new Response("Session not found", { status: 404 })

  const userMessage = focus
    ? `Generate an architecture diagram focused on: ${focus}`
    : `Generate a high-level architecture diagram of this entire codebase`

  const response = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 8000,
    thinking: { type: "adaptive" },
    output_config: { effort: "high" },
    system: DIAGRAM_SYSTEM_PROMPT + "\n\n" + session.context,
    messages: [{ role: "user", content: userMessage }],
  })

  // Extract JSON from response
  const textContent = response.content.find(b => b.type === "text")
  const diagramData = JSON.parse(textContent.text) as DiagramData

  return Response.json(diagramData)
}
```

#### 2. Architecture Diagram Component (`src/components/architecture-diagram.tsx`)

React Flow wrapper that:
- Receives `DiagramData` from API
- Converts to React Flow nodes/edges format
- Applies dagre auto-layout
- Renders interactive graph with zoom, pan, click
- Custom nodes with colored badges by type (module=blue, component=green, etc.)
- Custom edges with labels
- Fit-to-view on initial render
- "Regenerate" button to get a new diagram
- Optional focus input ("Show me the auth system")

```typescript
import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react'
import dagre from '@dagrejs/dagre'
import '@xyflow/react/dist/style.css'

// Convert DiagramData to React Flow format with dagre layout
function layoutDiagram(data: DiagramData) {
  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'TB', nodesep: 80, ranksep: 100 })

  data.nodes.forEach(node => {
    g.setNode(node.id, { width: 200, height: 60 })
  })

  data.edges.forEach(edge => {
    g.setEdge(edge.source, edge.target)
  })

  dagre.layout(g)

  const nodes = data.nodes.map(node => {
    const pos = g.node(node.id)
    return {
      id: node.id,
      type: 'moduleNode',
      data: { label: node.label, nodeType: node.type, description: node.description },
      position: { x: pos.x - 100, y: pos.y - 30 },
    }
  })

  const edges = data.edges.map((edge, i) => ({
    id: `e-${i}`,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    animated: edge.type === 'uses',
    style: { stroke: edgeColors[edge.type] },
  }))

  return { nodes, edges }
}
```

#### 3. Custom Diagram Node (`src/components/diagram-node.tsx`)

```tsx
'use client'
import { Handle, Position } from '@xyflow/react'
import { Badge } from '@/components/ui/badge'

const typeColors = {
  module: 'bg-blue-500',
  component: 'bg-green-500',
  util: 'bg-yellow-500',
  config: 'bg-purple-500',
  test: 'bg-gray-500',
  entry: 'bg-red-500',
}

export function ModuleNode({ data }: { data: { label: string, nodeType: string, description: string } }) {
  return (
    <div className="px-4 py-3 rounded-lg border bg-card shadow-sm min-w-[180px]">
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-2 h-2 rounded-full ${typeColors[data.nodeType]}`} />
        <span className="font-medium text-sm">{data.label}</span>
      </div>
      <p className="text-xs text-muted-foreground">{data.description}</p>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
```

### Success Criteria:

#### Automated Verification:
- [ ] `POST /api/diagram` returns valid `DiagramData` JSON
- [ ] JSON has 10-25 nodes and valid edges
- [ ] `npm run build` passes

#### Manual Verification:
- [ ] Diagram renders as an interactive graph with proper layout
- [ ] Nodes are colored by type (module=blue, component=green, etc.)
- [ ] Edges show relationship labels
- [ ] Zoom, pan, and minimap work
- [ ] Focus query ("Show me the routing system") generates a relevant sub-diagram
- [ ] Diagram looks visually impressive and professional

---

## Phase 5: Main Exploration UI

### Overview
Build the main exploration page that ties together the ingestion, Q&A, and diagram features into a cohesive, polished user experience.

### Changes Required:

#### 1. Explore Page (`src/app/explore/page.tsx`)

Layout:
```
┌─────────────────────────────────────────────────┐
│  Header: RepoMind logo  |  theme toggle         │
├─────────────────────────────────────────────────┤
│  Repo bar: [GitHub URL input] [Load] [Preloaded]│
│  Token counter: ████████░░ 523K / 1M tokens     │
├────────────────────┬────────────────────────────┤
│                    │                            │
│   Chat Panel       │   Diagram / Info Panel     │
│   (Q&A interface)  │   (tabs: Diagram | Files)  │
│                    │                            │
│   [thinking...]    │   [React Flow diagram]     │
│   [response...]    │   [or file tree browser]   │
│                    │                            │
│   [input box]      │   [Generate Diagram btn]   │
│                    │                            │
├────────────────────┴────────────────────────────┤
│  Footer: "Powered by Claude Opus 4.6" | tokens  │
└─────────────────────────────────────────────────┘
```

State management:
- `sessionId` — current active session
- `isLoading` — repo ingestion in progress
- `metadata` — repo info after ingestion
- `messages` — chat history
- `diagramData` — current diagram
- `activeTab` — "chat" | "diagram" | "files"

On mobile: stack panels vertically with tab navigation.

#### 2. Repo Input Component (`src/components/repo-input.tsx`)

- Text input for GitHub URL
- Dropdown/chips for pre-loaded repos: React, Express, Next.js
- "Load" button with loading state
- Validation: must be valid GitHub URL
- Shows repo metadata after load (name, file count, token count, languages)

#### 3. Token Counter Component (`src/components/token-counter.tsx`)

Animated progress bar showing:
- Current token count / 1M max
- Percentage filled
- Color gradient (green → yellow → red as it fills)
- Animated counting effect during ingestion
- Shows "Ready" badge when ingestion complete

#### 4. Suggested Questions

After ingestion, show suggested questions as clickable chips:
- "What does this codebase do?"
- "Explain the architecture and key modules"
- "What design patterns are used?"
- "Find potential performance issues"
- "How does error handling work?"

#### 5. Effort Selector

Small dropdown or toggle allowing user to switch between effort levels:
- "Quick" (low) — fast, brief answers
- "Balanced" (medium) — default
- "Deep" (high) — thorough analysis
- "Maximum" (max) — deepest reasoning, Opus 4.6 only

Show this as a subtle control near the input, demonstrating adaptive thinking.

### Success Criteria:

#### Automated Verification:
- [ ] `npm run build` passes
- [ ] `/explore` page renders without errors
- [ ] All components mount correctly

#### Manual Verification:
- [ ] Full flow works: enter URL → load → ask question → get answer
- [ ] Pre-loaded repos load instantly
- [ ] Token counter animates during ingestion
- [ ] Two-panel layout works on desktop
- [ ] Mobile layout stacks correctly
- [ ] Suggested questions are clickable and trigger queries
- [ ] Effort selector changes response depth
- [ ] Diagram tab generates and displays architecture

---

## Phase 6: Landing Page

### Overview
Create an impressive landing page that communicates RepoMind's value proposition and leads to the demo. This is the first thing judges see.

### Changes Required:

#### 1. Home Page (`src/app/page.tsx`)

Sections:
1. **Hero**: Large heading "Understand any codebase in seconds, not weeks" with animated gradient text. Subheading about Opus 4.6's 1M context. CTA button "Try it now →" linking to `/explore`
2. **How it works**: 3-step visual (Paste URL → Ask anything → Get insights). Simple icons + brief descriptions
3. **Features grid**: 4 cards highlighting key capabilities
   - 1M Token Context: "Entire codebases, not just snippets"
   - Adaptive Thinking: "Deep reasoning when you need it"
   - Architecture Diagrams: "Visualize any codebase instantly"
   - Streaming Responses: "Real-time answers, not waiting"
4. **Demo preview**: Embedded screenshot or animated GIF of the explore page in action
5. **Built with**: "Built with Claude Code, powered by Claude Opus 4.6" badge. Link to GitHub repo
6. **Footer**: "Cerebral Valley Hackathon 2026 | X-Arc-ai" | GitHub link

Design: Dark mode by default. Gradient accents (purple → blue, matching Anthropic brand). Smooth scroll animations. Responsive.

### Success Criteria:

#### Automated Verification:
- [ ] `npm run build` passes
- [ ] Home page renders at `/`

#### Manual Verification:
- [ ] Landing page is visually impressive
- [ ] CTA links to `/explore`
- [ ] Responsive on mobile
- [ ] Animations are smooth
- [ ] Dark mode is the default, light mode also works

---

## Phase 7: Demo Preparation & Polish

### Overview
Prepare pre-loaded repos, test demo scenarios, add finishing touches, and ensure a bulletproof demo experience.

### Changes Required:

#### 1. Pre-load Demo Repos

Script to pre-clone and pre-build context for demo repos:
```bash
# scripts/preload-repos.sh
git clone --depth 1 https://github.com/expressjs/express /tmp/repomind-repos/expressjs/express
git clone --depth 1 https://github.com/facebook/react /tmp/repomind-repos/facebook/react
git clone --depth 1 https://github.com/vercel/next.js /tmp/repomind-repos/vercel/next.js
```

Pre-generate context documents and store as JSON files in `public/preloaded/` for instant loading.

#### 2. Pre-tested Demo Questions

Create a list of impressive questions that reliably produce great answers:

**For React:**
- "Explain how React's reconciliation algorithm works"
- "Show me all places where state updates could cause infinite loops"
- "What is the Fiber architecture and how does it enable concurrent rendering?"
- "Generate an architecture diagram of React's core modules"

**For Express:**
- "Explain the middleware chain and how `next()` works"
- "What security headers does Express set by default?"
- "How does routing work internally?"

**For Next.js:**
- "Explain the difference between App Router and Pages Router"
- "How does server-side rendering work under the hood?"
- "What caching strategies does Next.js use?"

#### 3. Error Handling & Edge Cases

- Show friendly error if GitHub URL is invalid or repo doesn't exist
- Show friendly error if repo is too large (> 1M tokens even after prioritization)
- Show friendly error if API key is missing or rate limited
- Graceful degradation if streaming fails (show "Reconnecting...")
- Timeout handling for slow clones (show progress)

#### 4. Performance Optimizations

- Cache context documents in memory (already planned)
- Cache diagram data per session
- Debounce user input
- Use `React.memo` on expensive components
- Lazy-load React Flow (dynamic import)

#### 5. README and Metadata

- Write comprehensive README.md for the GitHub repo
- Add OpenGraph metadata for link previews
- Add favicon (brain + magnifying glass icon)

#### 6. Deployment

Deploy to Vercel:
```bash
npm install -g vercel
vercel --prod
```

Environment variables set in Vercel dashboard:
- `ANTHROPIC_API_KEY`
- `REPO_CACHE_DIR=/tmp/repomind-repos`

### Success Criteria:

#### Automated Verification:
- [ ] All pre-loaded repos generate valid context documents
- [ ] `npm run build` passes
- [ ] `vercel build` passes
- [ ] No TypeScript errors

#### Manual Verification:
- [ ] Demo flow works end-to-end without errors for all 3 pre-loaded repos
- [ ] Pre-tested questions produce impressive, accurate answers
- [ ] Architecture diagrams are visually correct
- [ ] Error states are friendly and helpful
- [ ] Page load is fast (< 2s)
- [ ] Deployed URL works from external network

---

## Testing Strategy

### Unit Tests:
- File prioritizer: correct ordering of files by type and importance
- Context builder: correct truncation at token budget
- URL validation: accepts valid GitHub URLs, rejects invalid ones

### Integration Tests:
- Full ingestion pipeline: URL → clone → context → token count
- SSE streaming: verify event format and completeness
- Diagram generation: verify valid JSON structure

### Manual Testing Steps:
1. Load Express repo from URL — verify ingestion completes
2. Ask "What does this codebase do?" — verify coherent answer
3. Ask follow-up "How does routing work?" — verify context is maintained
4. Switch to Diagram tab — verify architecture renders
5. Load React (pre-loaded) — verify instant load
6. Ask complex question with "Maximum" effort — verify deeper thinking
7. Test on mobile viewport — verify responsive layout
8. Test dark/light mode toggle — verify all components switch correctly
9. Test error case: enter invalid URL — verify friendly error
10. Test error case: enter private repo URL — verify friendly error

### Demo Rehearsal:
- Run through the full 5-minute demo script 3 times
- Time each section
- Identify any slow/unreliable parts and prepare fallbacks

---

## Performance Considerations

- **First query latency**: 1M token context means the first query will take 10-30 seconds. Show thinking indicator prominently. Pre-load repos to avoid clone time.
- **API costs**: 1M context at premium rates ($10/M input) means ~$10 per query session. Acceptable for hackathon demo, not for production.
- **Memory usage**: Storing context strings in memory. At ~4MB per session (1M tokens × 4 bytes), and max ~10 concurrent sessions, that's ~40MB — fine for a hackathon server.
- **Clone speed**: Shallow clones (`--depth 1`) are fast. Large repos (React: ~200MB) might take 10-20 seconds. Pre-loading eliminates this for demos.

---

## Implementation Order (Critical Path)

This is the recommended execution order for maximum parallelism:

1. **Phase 1** (scaffolding) — must be first, everything depends on it
2. **Phase 2** (ingestion) — core engine, blocks Phase 3 and 4
3. **Phase 3** (Q&A streaming) — hero feature, can start once ingestion basics work
4. **Phase 4** (diagrams) — can be built in parallel with Phase 3 once Phase 2 is done
5. **Phase 5** (exploration UI) — ties everything together, needs Phase 3 + 4
6. **Phase 6** (landing page) — independent, can be built in parallel with Phase 5
7. **Phase 7** (demo prep) — final polish, needs everything else

**Minimum viable demo** (if time is tight): Phase 1 + 2 + 3 + simplified Phase 5. Skip diagrams and landing page.

---

## References

- Research artifact: `thoughts/shared/research/2026-02-15-hackathon-research.md`
- [Anthropic TypeScript SDK](https://github.com/anthropics/anthropic-sdk-typescript)
- [Claude Opus 4.6 — Adaptive Thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Claude Opus 4.6 — Effort Parameter](https://platform.claude.com/docs/en/build-with-claude/effort)
- [Claude Opus 4.6 — Context Windows (1M)](https://platform.claude.com/docs/en/build-with-claude/context-windows)
- [Next.js App Router Documentation](https://nextjs.org/docs)
- [React Flow (@xyflow/react)](https://reactflow.dev)
- [React Flow — Dagre Layout Example](https://reactflow.dev/examples/layout/dagre)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [shadcn/ui — Tailwind v4 Migration](https://ui.shadcn.com/docs/tailwind-v4)
- [tw-animate-css](https://www.npmjs.com/package/tw-animate-css)
- [next-themes](https://github.com/pacocoursey/next-themes)
