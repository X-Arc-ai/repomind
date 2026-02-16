"use client"

import { useState, useRef, useEffect } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { MessageBubble } from "./message-bubble"
import { Send, Sparkles } from "lucide-react"

// Polyfill for crypto.randomUUID in non-secure contexts
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return generateUUID()
  }
  // Fallback for HTTP contexts
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  thinking?: string
}

const SUGGESTED_QUESTIONS = [
  "What does this codebase do?",
  "Explain the architecture and key modules",
  "What design patterns are used?",
  "Find potential performance issues",
  "How does error handling work?",
]

interface ChatInterfaceProps {
  sessionId: string | null
  effort: string
}

export function ChatInterface({ sessionId, effort }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Reset messages when session changes
  useEffect(() => {
    setMessages([])
  }, [sessionId])

  const sendQuery = async (query: string) => {
    if (!sessionId || isStreaming) return

    const userMsg: Message = {
      id: generateUUID(),
      role: "user",
      content: query,
    }

    const assistantMsg: Message = {
      id: generateUUID(),
      role: "assistant",
      content: "",
      thinking: "",
    }

    setMessages((prev) => [...prev, userMsg, assistantMsg])
    setInput("")
    setIsStreaming(true)

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, query, effort }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Query failed")
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          try {
            const data = JSON.parse(line.slice(6))

            if (data.type === "text") {
              setMessages((prev) => {
                const updated = [...prev]
                const last = updated[updated.length - 1]
                if (last.role === "assistant") {
                  last.content += data.text
                }
                return updated
              })
            } else if (data.type === "thinking") {
              setMessages((prev) => {
                const updated = [...prev]
                const last = updated[updated.length - 1]
                if (last.role === "assistant") {
                  last.thinking = (last.thinking || "") + data.text
                }
                return updated
              })
            } else if (data.type === "error") {
              setMessages((prev) => {
                const updated = [...prev]
                const last = updated[updated.length - 1]
                if (last.role === "assistant") {
                  last.content = `Error: ${data.error}`
                }
                return updated
              })
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev]
        const last = updated[updated.length - 1]
        if (last.role === "assistant") {
          last.content = `Error: ${err instanceof Error ? err.message : "Query failed"}`
        }
        return updated
      })
    } finally {
      setIsStreaming(false)
    }
  }

  const handleSubmit = () => {
    const trimmed = input.trim()
    if (trimmed) sendQuery(trimmed)
  }

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && sessionId && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Sparkles className="h-8 w-8 text-primary mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Ask anything about this codebase
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendQuery(q)}
                  className="text-xs px-3 py-1.5 rounded-full bg-secondary hover:bg-accent text-secondary-foreground transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {!sessionId && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">
              Load a repository to start exploring
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            role={msg.role}
            content={msg.content}
            thinking={msg.thinking}
            isStreaming={isStreaming && msg === messages[messages.length - 1] && msg.role === "assistant"}
          />
        ))}
      </div>

      <div className="border-t p-3">
        <div className="flex gap-2">
          <Textarea
            placeholder={sessionId ? "Ask about this codebase..." : "Load a repo first"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
            disabled={!sessionId || isStreaming}
            className="min-h-[44px] max-h-32 resize-none"
            rows={1}
          />
          <Button
            onClick={handleSubmit}
            disabled={!sessionId || !input.trim() || isStreaming}
            size="icon"
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
