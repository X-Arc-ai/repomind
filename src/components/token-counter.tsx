"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"

interface TokenCounterProps {
  tokenCount: number
  isLoading: boolean
}

const MAX_TOKENS = 1_000_000

export function TokenCounter({ tokenCount, isLoading }: TokenCounterProps) {
  const [displayCount, setDisplayCount] = useState(0)

  // Animate counting effect
  useEffect(() => {
    if (tokenCount === 0) {
      setDisplayCount(0)
      return
    }

    const duration = 800
    const startTime = Date.now()
    const startCount = displayCount

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayCount(Math.round(startCount + (tokenCount - startCount) * eased))

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [tokenCount])

  if (tokenCount === 0 && !isLoading) return null

  const percentage = (displayCount / MAX_TOKENS) * 100
  const color =
    percentage < 30
      ? "bg-green-500"
      : percentage < 60
        ? "bg-yellow-500"
        : percentage < 80
          ? "bg-orange-500"
          : "bg-red-500"

  const formatTokens = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
    return n.toString()
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-300 rounded-full`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
        <span>{formatTokens(displayCount)} / 1M tokens</span>
        {!isLoading && tokenCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            Ready
          </Badge>
        )}
        {isLoading && (
          <Badge variant="outline" className="text-xs animate-pulse">
            Loading...
          </Badge>
        )}
      </div>
    </div>
  )
}
