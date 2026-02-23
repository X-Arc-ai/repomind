"use client"

import { useState } from "react"
import { Key, Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

interface SettingsDialogProps {
  apiKey: string
  onApiKeyChange: (key: string) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ apiKey, onApiKeyChange, open, onOpenChange }: SettingsDialogProps) {
  const [showKey, setShowKey] = useState(false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription className="sr-only">Configure your RepoMind settings</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">API Key</label>
            <p className="text-xs text-muted-foreground mt-1">
              Required to use RepoMind. Your key is stored locally in your browser and never sent to our servers.
            </p>
          </div>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type={showKey ? "text" : "password"}
              placeholder="sk-ant-..."
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              className="pl-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs text-primary hover:underline"
          >
            Get an API key &rarr;
          </a>
        </div>
      </DialogContent>
    </Dialog>
  )
}
