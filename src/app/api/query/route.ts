import { getSession } from "@/lib/anthropic"
import { anthropic } from "@/lib/anthropic"
import { QA_SYSTEM_PROMPT } from "@/lib/prompts"

export const dynamic = "force-dynamic"
export const maxDuration = 120

export async function POST(req: Request) {
  try {
    const { sessionId, query, effort = "high" } = await req.json()

    if (!sessionId || !query) {
      return new Response(
        JSON.stringify({ error: "sessionId and query are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    const session = getSession(sessionId)
    if (!session) {
      return new Response(
        JSON.stringify({ error: "Session not found. Please ingest a repo first." }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    // Build messages array with conversation history
    const messages = [
      ...session.messages,
      { role: "user" as const, content: query },
    ]

    // Use beta endpoint for 1M context if needed
    const useBeta = session.tokenCount > 200_000

    const streamParams = {
      model: "claude-opus-4-6" as const,
      max_tokens: 16000,
      thinking: { type: "enabled" as const, budget_tokens: 10000 },
      system: QA_SYSTEM_PROMPT + "\n\n" + session.context,
      messages,
    }

    let stream: AsyncIterable<unknown>

    if (useBeta) {
      stream = anthropic.beta.messages.stream({
        ...streamParams,
        betas: ["interleaved-thinking-2025-05-14"],
      }) as AsyncIterable<unknown>
    } else {
      stream = anthropic.messages.stream(streamParams) as AsyncIterable<unknown>
    }

    const encoder = new TextEncoder()
    let fullText = ""
    let fullThinking = ""

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream as AsyncIterable<Record<string, unknown>>) {
            const eventType = event.type as string

            if (eventType === "content_block_start") {
              const block = event.content_block as Record<string, unknown>
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "block_start", blockType: block.type })}\n\n`
                )
              )
            } else if (eventType === "content_block_delta") {
              const delta = event.delta as Record<string, unknown>
              if (delta.type === "text_delta") {
                const text = delta.text as string
                fullText += text
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: "text", text })}\n\n`
                  )
                )
              } else if (delta.type === "thinking_delta") {
                const thinking = delta.thinking as string
                fullThinking += thinking
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: "thinking", text: thinking })}\n\n`
                  )
                )
              }
            } else if (eventType === "message_stop") {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "done" })}\n\n`
                )
              )
            }
          }

          // Update conversation history
          session.messages.push(
            { role: "user", content: query },
            { role: "assistant", content: fullText }
          )

          controller.close()
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Stream error"
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", error: msg })}\n\n`
            )
          )
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Query failed"
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
