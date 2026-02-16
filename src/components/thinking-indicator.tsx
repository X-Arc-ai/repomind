"use client"

import { useState } from "react"
import { Brain, ChevronDown, ChevronRight } from "lucide-react"

interface ThinkingIndicatorProps {
  thinking: string
  isStreaming?: boolean
}

export function ThinkingIndicator({ thinking, isStreaming }: ThinkingIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!thinking && !isStreaming) return null

  return (
    <div className="mb-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Brain className={`h-3.5 w-3.5 ${isStreaming ? "animate-pulse text-primary" : ""}`} />
        <span>{isStreaming ? "Thinking..." : "Thought process"}</span>
        {isExpanded ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
      </button>

      {isExpanded && thinking && (
        <div className="mt-2 p-3 rounded-md bg-muted/50 border border-border/50">
          <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
            {thinking}
          </pre>
        </div>
      )}
    </div>
  )
}
