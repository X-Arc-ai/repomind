import { FileEntry } from "@/types"
import {
  shouldExcludePath,
  isBinaryFile,
  detectLanguage,
  getFilePriority,
} from "./file-prioritizer"
import { buildFileTree, buildContext } from "./context-builder"
import { createSession } from "./anthropic"
import { IngestResponse } from "@/types"

const GITHUB_API = "https://api.github.com"

interface GitHubTreeItem {
  path: string
  mode: string
  type: "blob" | "tree"
  sha: string
  size?: number
  url: string
}

function getGitHubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "RepoMind",
  }
  const token = process.env.GITHUB_TOKEN
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }
  return headers
}

async function fetchRepoTree(owner: string, name: string): Promise<GitHubTreeItem[]> {
  const headers = getGitHubHeaders()

  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${name}/git/trees/HEAD?recursive=1`,
    { headers }
  )

  if (!res.ok) {
    if (res.status === 404) throw new Error(`Repository ${owner}/${name} not found or is private.`)
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`)
  }

  const data = await res.json() as { tree: GitHubTreeItem[]; truncated: boolean }
  return data.tree.filter((item) => item.type === "blob")
}

async function fetchFileContent(owner: string, name: string, filePath: string): Promise<string> {
  const headers = getGitHubHeaders()

  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${name}/contents/${encodeURIComponent(filePath)}`,
    { headers }
  )

  if (!res.ok) return ""

  const data = await res.json() as { encoding?: string; content?: string }
  if (data.encoding === "base64" && data.content) {
    return atob(data.content.replace(/\n/g, ""))
  }
  return ""
}

// Parse GitHub URL into owner/name
export function parseGitHubUrl(url: string): { owner: string; name: string } | null {
  // Handle formats:
  // https://github.com/owner/name
  // https://github.com/owner/name.git
  // github.com/owner/name
  const match = url.match(
    /(?:https?:\/\/)?github\.com\/([^/]+)\/([^/.]+)(?:\.git)?/
  )
  if (!match) return null
  return { owner: match[1], name: match[2] }
}

// Full ingestion pipeline
export async function ingestRepo(url: string): Promise<IngestResponse> {
  const parsed = parseGitHubUrl(url)
  if (!parsed) {
    throw new Error("Invalid GitHub URL. Expected format: https://github.com/owner/repo")
  }

  const { owner, name } = parsed

  // Fetch repo tree via GitHub API
  const treeItems = await fetchRepoTree(owner, name)

  // Filter files using existing prioritizer logic
  const eligibleItems = treeItems.filter((item) => {
    if (shouldExcludePath(item.path)) return false
    if (isBinaryFile(item.path)) return false
    // Skip files larger than 500KB
    if (item.size && item.size > 500_000) return false
    return true
  })

  // Fetch file contents in batches of 10 to respect rate limits
  const files: FileEntry[] = []
  const BATCH_SIZE = 10

  for (let i = 0; i < eligibleItems.length; i += BATCH_SIZE) {
    const batch = eligibleItems.slice(i, i + BATCH_SIZE)
    const results = await Promise.all(
      batch.map(async (item) => {
        const content = await fetchFileContent(owner, name, item.path)
        if (!content) return null
        // Skip files that look binary (contain null bytes)
        if (content.includes("\0")) return null

        const language = detectLanguage(item.path)
        const priority = getFilePriority(item.path)

        return {
          path: item.path,
          content,
          language,
          size: item.size || content.length,
          priority,
        } as FileEntry
      })
    )

    for (const file of results) {
      if (file) files.push(file)
    }
  }

  // Build file tree string
  const fileTree = buildFileTree(files)

  // Build context document
  const result = buildContext(owner, name, url, files, fileTree)

  // Create session (now async — returns a Promise<string>)
  const sessionId = await createSession(
    result.context,
    result.metadata,
    result.estimatedTokens
  )

  return {
    sessionId,
    metadata: result.metadata,
    tokenCount: result.estimatedTokens,
    truncated: result.truncated,
    filesIncluded: result.filesIncluded,
    filesTotal: result.filesTotal,
  }
}

// Ingest from pre-loaded repo aliases (delegates to ingestRepo)
export async function ingestPreloaded(
  alias: string
): Promise<IngestResponse> {
  const preloadedRepos: Record<string, string> = {
    express: "https://github.com/expressjs/express",
    react: "https://github.com/facebook/react",
    nextjs: "https://github.com/vercel/next.js",
  }

  const url = preloadedRepos[alias]
  if (!url) {
    throw new Error(
      `Unknown preloaded repo: ${alias}. Available: ${Object.keys(preloadedRepos).join(", ")}`
    )
  }

  return ingestRepo(url)
}
