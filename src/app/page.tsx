import Link from "next/link"
import { Header } from "@/components/header"
import { Brain, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center px-4 max-w-3xl">
          <div className="flex justify-center mb-6">
            <Brain className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-4">
            Understand any codebase in{" "}
            <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
              seconds
            </span>
            , not weeks
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            RepoMind uses Claude Opus 4.6&apos;s 1M token context window to
            ingest and understand entire codebases at once. Ask questions, get
            architecture diagrams, and explore any GitHub repository instantly.
          </p>
          <Button asChild size="lg" className="text-lg px-8 py-6">
            <Link href="/explore">
              Try it now <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
