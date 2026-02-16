import { NextResponse } from "next/server"
import { getSession, anthropic } from "@/lib/anthropic"
import { DIAGRAM_SYSTEM_PROMPT } from "@/lib/prompts"
import { DiagramData } from "@/types"

export const dynamic = "force-dynamic"
export const runtime = "edge"

export async function POST(req: Request) {
  try {
    const { sessionId, focus } = await req.json<{ sessionId?: string; focus?: string }>()

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      )
    }

    const session = await getSession(sessionId)
    if (!session) {
      return NextResponse.json(
        { error: "Session not found. Please ingest a repo first." },
        { status: 404 }
      )
    }

    const userMessage = focus
      ? `Generate an architecture diagram focused on: ${focus}`
      : `Generate a high-level architecture diagram of this entire codebase`

    // Always use beta endpoint for 1M context
    const response = await anthropic.beta.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 16000,
      thinking: { type: "enabled", budget_tokens: 8000 },
      system: DIAGRAM_SYSTEM_PROMPT + "\n\n" + session.context,
      messages: [{ role: "user", content: userMessage }],
      betas: ["context-1m-2025-08-07", "interleaved-thinking-2025-05-14"],
    })

    // Extract JSON from response text blocks
    const textContent = response.content.find(
      (b) => b.type === "text"
    )
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json(
        { error: "No text response from model" },
        { status: 500 }
      )
    }

    // Try to parse JSON (model may wrap in code fences)
    let jsonText = textContent.text.trim()
    // Strip markdown code fences if present
    const fenceMatch = jsonText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
    if (fenceMatch) {
      jsonText = fenceMatch[1].trim()
    }

    const diagramData: DiagramData = JSON.parse(jsonText)

    return NextResponse.json(diagramData)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Diagram generation failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
