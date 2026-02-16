import Anthropic from "@anthropic-ai/sdk"
import { RepoMetadata, SessionData } from "@/types"

export const anthropic = new Anthropic()

// In-memory session storage
const sessions = new Map<string, SessionData>()

export function getSession(sessionId: string): SessionData | undefined {
  return sessions.get(sessionId)
}

export function setSession(sessionId: string, data: SessionData): void {
  sessions.set(sessionId, data)
}

export function deleteSession(sessionId: string): void {
  sessions.delete(sessionId)
}

export function createSession(
  context: string,
  metadata: RepoMetadata,
  tokenCount: number
): string {
  const sessionId = crypto.randomUUID()
  sessions.set(sessionId, {
    context,
    metadata,
    messages: [],
    tokenCount,
    createdAt: Date.now(),
  })
  return sessionId
}

// Cleanup stale sessions every 10 minutes (1-hour TTL)
if (typeof globalThis !== "undefined") {
  const cleanup = () => {
    const now = Date.now()
    for (const [id, session] of sessions) {
      if (now - session.createdAt > 3600000) {
        sessions.delete(id)
      }
    }
  }
  // Avoid duplicate intervals in dev mode hot reload
  const key = "__repomind_cleanup_interval__"
  const g = globalThis as Record<string, unknown>
  if (!g[key]) {
    g[key] = setInterval(cleanup, 600000)
  }
}
