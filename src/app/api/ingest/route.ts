import { NextResponse } from "next/server"
import { ingestRepo, ingestPreloaded } from "@/lib/repo-ingester"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const { url, preloaded } = await req.json<{ url?: string; preloaded?: string }>()

    if (!url && !preloaded) {
      return NextResponse.json(
        { error: "Must provide either 'url' or 'preloaded' field" },
        { status: 400 }
      )
    }

    const result = preloaded
      ? await ingestPreloaded(preloaded)
      : await ingestRepo(url!)

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ingestion failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
