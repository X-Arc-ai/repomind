"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Star, ArrowRight, History } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export interface RecentRepo {
  name: string
  url: string
  stars: number
  summary: string
  exploredAt: string
}

const STORAGE_KEY = "repomind-recently-explored"
const MAX_ITEMS = 3

export function getRecentRepos(): RecentRepo[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveRecentRepo(repo: Omit<RecentRepo, "exploredAt">) {
  const existing = getRecentRepos()
  const filtered = existing.filter((r) => r.url !== repo.url)
  const updated = [
    { ...repo, exploredAt: new Date().toISOString() },
    ...filtered,
  ].slice(0, MAX_ITEMS)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}

function formatStars(stars: number): string {
  if (stars >= 1000) return `${(stars / 1000).toFixed(1)}k`
  return String(stars)
}

export function RecentlyExplored() {
  const [repos, setRepos] = useState<RecentRepo[]>([])

  useEffect(() => {
    setRepos(getRecentRepos())
  }, [])

  if (repos.length === 0) return null

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
      <div className="flex items-center justify-center gap-2 mb-12">
        <History className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-center text-2xl font-bold sm:text-3xl">
          Recently explored
        </h2>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {repos.map((repo) => (
          <Link
            key={repo.url}
            href={`/explore?repo=${encodeURIComponent(repo.url)}`}
          >
            <Card className="group cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30 h-full">
              <CardContent className="pt-0">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                    {repo.name}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground shrink-0">
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    {formatStars(repo.stars)}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4">
                  {repo.summary}
                </p>
                <div className="flex items-center gap-1 text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Explore again <ArrowRight className="h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}
