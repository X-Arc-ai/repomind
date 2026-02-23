import { RepoMetadata, SessionData } from "@/types"

const sessions = new Map<string, { data: SessionData; expiresAt: number }>()
const TTL_MS = 60 * 60 * 1000 // 1 hour

// Lazy cleanup: on every get/set, purge expired entries (max 100 per sweep)
function cleanup() {
  const now = Date.now()
  let count = 0
  for (const [key, entry] of sessions) {
    if (entry.expiresAt < now) {
      sessions.delete(key)
      if (++count >= 100) break
    }
  }
}

export async function getSession(sessionId: string): Promise<SessionData | null> {
  cleanup()
  const entry = sessions.get(sessionId)
  if (!entry) return null
  if (entry.expiresAt < Date.now()) {
    sessions.delete(sessionId)
    return null
  }
  return entry.data
}

export async function setSession(sessionId: string, data: SessionData): Promise<void> {
  cleanup()
  sessions.set(sessionId, { data, expiresAt: Date.now() + TTL_MS })
}

export async function deleteSession(sessionId: string): Promise<void> {
  sessions.delete(sessionId)
}

export async function createSession(
  context: string,
  metadata: RepoMetadata,
  tokenCount: number
): Promise<string> {
  const sessionId = crypto.randomUUID()
  await setSession(sessionId, {
    context,
    metadata,
    messages: [],
    tokenCount,
    createdAt: Date.now(),
  })
  return sessionId
}
