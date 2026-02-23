"use client"

import Link from "next/link"
import { Brain, Settings } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { SettingsDialog } from "@/components/settings-dialog"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  apiKey?: string
  onApiKeyChange?: (key: string) => void
  settingsOpen?: boolean
  onSettingsOpenChange?: (open: boolean) => void
}

export function Header({ apiKey, onApiKeyChange, settingsOpen, onSettingsOpenChange }: HeaderProps = {}) {
  const showSettings = onApiKeyChange !== undefined && onSettingsOpenChange !== undefined

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Brain className="h-6 w-6 text-primary" />
          <span className="text-lg">RepoMind</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/explore"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Explore
          </Link>
          {showSettings && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Settings"
              onClick={() => onSettingsOpenChange(true)}
            >
              <Settings className="h-5 w-5" />
            </Button>
          )}
          <ThemeToggle />
        </div>
      </div>
      {showSettings && (
        <SettingsDialog
          apiKey={apiKey ?? ""}
          onApiKeyChange={onApiKeyChange}
          open={settingsOpen ?? false}
          onOpenChange={onSettingsOpenChange}
        />
      )}
    </header>
  )
}
