"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Github, Key, Eye, EyeOff } from "lucide-react"

const PRELOADED_REPOS = [
  { alias: "express", label: "Express", description: "expressjs/express" },
  { alias: "react", label: "React", description: "facebook/react" },
  { alias: "nextjs", label: "Next.js", description: "vercel/next.js" },
]

interface RepoInputProps {
  onIngest: (sessionId: string, metadata: Record<string, unknown>) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  apiKey: string
  onApiKeyChange: (key: string) => void
}

export function RepoInput({ onIngest, isLoading, setIsLoading, apiKey, onApiKeyChange }: RepoInputProps) {
  const [url, setUrl] = useState("")
  const [error, setError] = useState("")
  const [showKey, setShowKey] = useState(false)

  const handleLoad = async (repoUrl?: string, preloaded?: string) => {
    setError("")
    setIsLoading(true)

    try {
      const body = preloaded ? { preloaded } : { url: repoUrl || url }
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (apiKey) {
        headers["x-api-key"] = apiKey
      }
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      })

      const data = await res.json() as any

      if (!res.ok) {
        throw new Error(data.error || "Failed to ingest repository")
      }

      onIngest(data.sessionId, data.metadata)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load repository")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type={showKey ? "text" : "password"}
            placeholder="Anthropic API key (optional — uses server key if blank)"
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            className="pl-10 pr-10"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Paste a GitHub URL (e.g. https://github.com/expressjs/express)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && url && handleLoad()}
            className="pl-10"
            disabled={isLoading}
          />
        </div>
        <Button
          onClick={() => handleLoad()}
          disabled={!url || isLoading}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load"}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Quick start:</span>
        {PRELOADED_REPOS.map((repo) => (
          <Badge
            key={repo.alias}
            variant="secondary"
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => !isLoading && handleLoad(undefined, repo.alias)}
          >
            {repo.label}
          </Badge>
        ))}
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
