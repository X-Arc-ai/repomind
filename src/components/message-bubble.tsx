"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ThinkingIndicator } from "./thinking-indicator"
import { cn } from "@/lib/utils"

interface MessageBubbleProps {
  role: "user" | "assistant"
  content: string
  thinking?: string
  isStreaming?: boolean
}

export function MessageBubble({
  role,
  content,
  thinking,
  isStreaming,
}: MessageBubbleProps) {
  const isUser = role === "user"

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-card border border-border"
        )}
      >
        {!isUser && (thinking || isStreaming) && (
          <ThinkingIndicator thinking={thinking || ""} isStreaming={isStreaming && !content} />
        )}

        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{content}</p>
        ) : content ? (
          <div className="prose prose-sm dark:prose-invert max-w-none [&_pre]:bg-muted [&_pre]:border [&_pre]:border-border [&_pre]:rounded-lg [&_pre]:p-3 [&_code]:text-xs [&_code]:font-mono [&_p]:leading-relaxed [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        ) : isStreaming ? (
          <div className="flex gap-1 py-1">
            <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
            <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
            <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
          </div>
        ) : null}
      </div>
    </div>
  )
}
