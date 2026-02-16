import Link from "next/link"
import { Header } from "@/components/header"
import {
  Brain,
  ArrowRight,
  Zap,
  MessageSquare,
  Network,
  Layers,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const FEATURES = [
  {
    icon: Layers,
    title: "1M Token Context",
    description:
      "Entire codebases loaded at once — not fragmented chunks. Full understanding, not partial guesses.",
  },
  {
    icon: Brain,
    title: "Adaptive Thinking",
    description:
      "Claude Opus 4.6's deep reasoning engine analyzes architecture, patterns, and design decisions.",
  },
  {
    icon: Network,
    title: "Architecture Diagrams",
    description:
      "Auto-generated interactive diagrams showing module dependencies and code structure.",
  },
  {
    icon: Zap,
    title: "Streaming Responses",
    description:
      "Watch reasoning happen in real-time. See thinking, then answers with specific code references.",
  },
]

const STEPS = [
  {
    num: "1",
    title: "Paste a GitHub URL",
    description: "Or pick a pre-loaded repo like React, Express, or Next.js",
  },
  {
    num: "2",
    title: "Ask anything",
    description:
      "\"How does routing work?\" \"Find security issues.\" \"Explain the architecture.\"",
  },
  {
    num: "3",
    title: "Get deep insights",
    description:
      "Streaming answers with specific file:line references and interactive architecture diagrams",
  },
]

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="relative mx-auto max-w-5xl px-4 pt-20 pb-16 text-center sm:pt-32 sm:pb-24">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground mb-8">
              <Brain className="h-4 w-4 text-primary" />
              Powered by Claude Opus 4.6
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Understand any codebase{" "}
              <span className="bg-gradient-to-r from-primary via-blue-500 to-violet-500 bg-clip-text text-transparent animate-gradient">
                in seconds
              </span>
              , not weeks
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              RepoMind loads entire repositories into a 1M token context window.
              Ask questions, get architecture diagrams, and truly understand any
              codebase — instantly.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="text-lg px-8 py-6 shadow-lg shadow-primary/20">
                <Link href="/explore">
                  Try it now <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
                <a
                  href="https://github.com/X-Arc-ai/repomind"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on GitHub
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
          <h2 className="text-center text-2xl font-bold sm:text-3xl mb-12">
            How it works
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.num} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold mb-4">
                  {step.num}
                </div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="border-t bg-muted/30">
          <div className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
            <h2 className="text-center text-2xl font-bold sm:text-3xl mb-12">
              Built for deep understanding
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border bg-card p-6 transition-colors hover:border-primary/30"
                >
                  <feature.icon className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-5xl px-4 py-16 sm:py-24 text-center">
          <div className="rounded-2xl border bg-card p-8 sm:p-12">
            <MessageSquare className="h-10 w-10 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold sm:text-3xl mb-3">
              Ready to explore?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Pick a pre-loaded repo or paste any public GitHub URL.
              No signup required.
            </p>
            <Button asChild size="lg" className="text-lg px-8 py-6">
              <Link href="/explore">
                Start exploring <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t">
          <div className="mx-auto max-w-5xl px-4 py-6 flex flex-col items-center gap-2 text-sm text-muted-foreground sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span>
                Built with{" "}
                <a
                  href="https://claude.ai/claude-code"
                  className="underline hover:text-foreground"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Claude Code
                </a>
                , powered by Claude Opus 4.6
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span>Cerebral Valley Hackathon 2026</span>
              <span className="text-border">|</span>
              <a
                href="https://github.com/X-Arc-ai/repomind"
                className="underline hover:text-foreground"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
