import Anthropic from "@anthropic-ai/sdk"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { RepoMetadata, SessionData } from "@/types"

export const anthropic = new Anthropic()

function getKV(): KVNamespace {
  const { env } = getCloudflareContext()
  return env.SESSIONS_KV
}

export async function getSession(sessionId: string): Promise<SessionData | null> {
  const kv = getKV()
  return await kv.get<SessionData>(sessionId, "json")
}

export async function setSession(sessionId: string, data: SessionData): Promise<void> {
  const kv = getKV()
  await kv.put(sessionId, JSON.stringify(data), {
    expirationTtl: 3600, // 1 hour TTL — replaces the setInterval cleanup
  })
}

export async function deleteSession(sessionId: string): Promise<void> {
  const kv = getKV()
  await kv.delete(sessionId)
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
