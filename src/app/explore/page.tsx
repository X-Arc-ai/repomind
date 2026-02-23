"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { RepoInput } from "@/components/repo-input"
import { saveRecentRepo } from "@/components/recently-explored"
import { TokenCounter } from "@/components/token-counter"
import { ChatInterface } from "@/components/chat-interface"
import { ArchitectureDiagram } from "@/components/architecture-diagram"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageSquare, Network, FileCode, Brain, Key } from "lucide-react"

const EFFORT_LEVELS = [
  { value: "low", label: "Quick", desc: "Fast, brief answers" },
  { value: "high", label: "Deep", desc: "Thorough analysis" },
  { value: "max", label: "Maximum", desc: "Deepest reasoning" },
]

export default function ExplorePage() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [tokenCount, setTokenCount] = useState(0)
  const [metadata, setMetadata] = useState<Record<string, unknown> | null>(null)
  const [effort, setEffort] = useState("high")
  const [activeTab, setActiveTab] = useState("chat")
  const [apiKey, setApiKey] = useState("")
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    setApiKey(localStorage.getItem("repomind-api-key") || "")
  }, [])

  const handleApiKeyChange = (key: string) => {
    setApiKey(key)
    localStorage.setItem("repomind-api-key", key)
  }

  const handleIngest = (newSessionId: string, newMetadata: Record<string, unknown>) => {
    setSessionId(newSessionId)
    setMetadata(newMetadata)
    setTokenCount((newMetadata.totalTokens as number) || 0)

    // Save to recently explored
    const repoName = (newMetadata.repoName as string) || (newMetadata.name as string) || "Unknown Repo"
    const repoUrl = (newMetadata.repoUrl as string) || (newMetadata.url as string) || ""
    saveRecentRepo({
      name: repoName,
      url: repoUrl,
      stars: (newMetadata.stars as number) || 0,
      summary: (newMetadata.description as string) || `${(newMetadata.fileCount as number) || 0} files analyzed`,
    })
  }

  return (
    <div className="h-screen flex flex-col">
      <Header
        apiKey={apiKey}
        onApiKeyChange={handleApiKeyChange}
        settingsOpen={settingsOpen}
        onSettingsOpenChange={setSettingsOpen}
      />

      {/* Repo Input Bar */}
      <div className="border-b px-4 py-3 space-y-2">
        <RepoInput
          onIngest={handleIngest}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          apiKey={apiKey}
        />
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <TokenCounter tokenCount={tokenCount} isLoading={isLoading} />
          </div>
          {metadata && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <FileCode className="h-3.5 w-3.5" />
              <span>
                {metadata.fileCount as number} files
              </span>
              {metadata.languages ? (
                <>
                  <span className="text-border">|</span>
                  {Object.entries(metadata.languages as Record<string, number>)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 3)
                    .map(([lang, count]) => (
                      <Badge key={lang} variant="outline" className="text-[10px] px-1.5 py-0">
                        {lang} ({count})
                      </Badge>
                    ))}
                </>
              ) : null}
            </div>
          )}
        </div>
        {/* Effort selector */}
        {sessionId && (
          <div className="flex items-center gap-2">
            <Brain className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Thinking effort:</span>
            <div className="flex gap-1">
              {EFFORT_LEVELS.map((level) => (
                <button
                  key={level.value}
                  onClick={() => setEffort(level.value)}
                  className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                    effort === level.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-accent"
                  }`}
                  title={level.desc}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-hidden relative">
        {/* API Key Required Overlay */}
        {!apiKey && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4 max-w-sm text-center p-6">
              <div className="rounded-full bg-muted p-3">
                <Key className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">API Key Required</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Add your Anthropic API key in Settings to start exploring repositories.
                </p>
              </div>
              <Button onClick={() => setSettingsOpen(true)}>
                Open Settings
              </Button>
            </div>
          </div>
        )}

        {/* Desktop: side-by-side */}
        <div className="hidden md:grid md:grid-cols-2 h-full divide-x">
          <div className="h-full overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/30">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Chat</span>
            </div>
            <div className="h-[calc(100%-41px)]">
              <ChatInterface sessionId={sessionId} effort={effort} apiKey={apiKey} />
            </div>
          </div>
          <div className="h-full overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/30">
              <Network className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Architecture</span>
            </div>
            <div className="h-[calc(100%-41px)]">
              <ArchitectureDiagram sessionId={sessionId} apiKey={apiKey} />
            </div>
          </div>
        </div>

        {/* Mobile: tabbed */}
        <div className="md:hidden h-full flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-2 mx-4 mt-2">
              <TabsTrigger value="chat" className="gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="diagram" className="gap-1.5">
                <Network className="h-3.5 w-3.5" />
                Diagram
              </TabsTrigger>
            </TabsList>
            <TabsContent value="chat" className="flex-1 overflow-hidden mt-0">
              <ChatInterface sessionId={sessionId} effort={effort} apiKey={apiKey} />
            </TabsContent>
            <TabsContent value="diagram" className="flex-1 overflow-hidden mt-0">
              <ArchitectureDiagram sessionId={sessionId} apiKey={apiKey} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
