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
import * as fs from "fs/promises"
import * as path from "path"
import { execSync } from "child_process"

const REPO_CACHE_DIR = process.env.REPO_CACHE_DIR || "/tmp/repomind-repos"

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

// Check if repo is already cached
async function isCached(owner: string, name: string): Promise<boolean> {
  try {
    await fs.access(path.join(REPO_CACHE_DIR, owner, name, ".git"))
    return true
  } catch {
    return false
  }
}

// Shallow clone a GitHub repo
async function cloneRepo(
  owner: string,
  name: string
): Promise<string> {
  const repoDir = path.join(REPO_CACHE_DIR, owner, name)

  if (await isCached(owner, name)) {
    return repoDir
  }

  // Ensure parent directory exists
  await fs.mkdir(path.join(REPO_CACHE_DIR, owner), { recursive: true })

  const url = `https://github.com/${owner}/${name}.git`
  try {
    execSync(`git clone --depth 1 "${url}" "${repoDir}"`, {
      timeout: 120_000, // 2 minute timeout
      stdio: "pipe",
    })
  } catch (err) {
    throw new Error(
      `Failed to clone ${owner}/${name}. Repository may not exist or is private.`
    )
  }

  return repoDir
}

// Recursively walk directory and collect files
async function walkDir(
  dir: string,
  baseDir: string,
  files: FileEntry[]
): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    const relativePath = path.relative(baseDir, fullPath)

    if (shouldExcludePath(relativePath)) continue

    if (entry.isDirectory()) {
      await walkDir(fullPath, baseDir, files)
    } else if (entry.isFile()) {
      if (isBinaryFile(entry.name)) continue

      try {
        const stat = await fs.stat(fullPath)
        // Skip files larger than 500KB entirely
        if (stat.size > 500_000) continue

        const content = await fs.readFile(fullPath, "utf-8")
        // Skip files that look binary (contain null bytes)
        if (content.includes("\0")) continue

        const language = detectLanguage(relativePath)
        const priority = getFilePriority(relativePath)

        files.push({
          path: relativePath,
          content,
          language,
          size: stat.size,
          priority,
        })
      } catch {
        // Skip files that can't be read
      }
    }
  }
}

// Full ingestion pipeline
export async function ingestRepo(url: string): Promise<IngestResponse> {
  const parsed = parseGitHubUrl(url)
  if (!parsed) {
    throw new Error("Invalid GitHub URL. Expected format: https://github.com/owner/repo")
  }

  const { owner, name } = parsed

  // Clone (or use cached)
  const repoDir = await cloneRepo(owner, name)

  // Walk file tree
  const files: FileEntry[] = []
  await walkDir(repoDir, repoDir, files)

  // Build file tree string
  const fileTree = buildFileTree(files)

  // Build context document
  const result = buildContext(owner, name, url, files, fileTree)

  // Create session
  const sessionId = createSession(
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

// Ingest from pre-loaded repos (same pipeline, just uses cached clone)
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
