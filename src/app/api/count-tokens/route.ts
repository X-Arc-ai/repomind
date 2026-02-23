import { NextResponse } from "next/server"
import { getSession } from "@/lib/session-store"
import { getAnthropicClient } from "@/lib/anthropic"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json() as { sessionId?: string }

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      )
    }

    const session = await getSession(sessionId)
    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      )
    }

    const anthropic = getAnthropicClient(req)

    const result = await anthropic.messages.countTokens({
      model: "claude-opus-4-6",
      system: session.context,
      messages: [{ role: "user", content: "test" }],
    })

    return NextResponse.json({
      tokenCount: result.input_tokens,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Token counting failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
