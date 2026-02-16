import Anthropic from "@anthropic-ai/sdk"
import { RepoMetadata, SessionData } from "@/types"

export const anthropic = new Anthropic()

// Use globalThis to persist sessions across hot reloads and route handlers
const g = globalThis as unknown as {
  __repomind_sessions__?: Map<string, SessionData>
  __repomind_cleanup__?: ReturnType<typeof setInterval>
}

if (!g.__repomind_sessions__) {
  g.__repomind_sessions__ = new Map<string, SessionData>()
}

const sessions = g.__repomind_sessions__

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
if (!g.__repomind_cleanup__) {
  g.__repomind_cleanup__ = setInterval(() => {
    const now = Date.now()
    for (const [id, session] of sessions) {
      if (now - session.createdAt > 3600000) {
        sessions.delete(id)
      }
    }
  }, 600000)
}
