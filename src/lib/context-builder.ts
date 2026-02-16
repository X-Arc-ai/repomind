import { FileEntry, RepoMetadata } from "@/types"
import { prioritizeFiles, countLanguages } from "./file-prioritizer"

// Conservative token estimate: ~4 chars per token
const CHARS_PER_TOKEN = 4
// Target budget: 800K tokens (leaving 200K for system prompt + response)
const TOKEN_BUDGET = 800_000
const MAX_FILE_SIZE = 50_000 // 50KB per file max

interface ContextResult {
  context: string
  metadata: RepoMetadata
  estimatedTokens: number
  filesIncluded: number
  filesTotal: number
  truncated: boolean
}

export function buildFileTree(files: FileEntry[]): string {
  const paths = files.map((f) => f.path).sort()
  const tree: string[] = []

  for (const filePath of paths) {
    const parts = filePath.split("/")
    const indent = "  ".repeat(parts.length - 1)
    tree.push(`${indent}${parts[parts.length - 1]}`)
  }

  return tree.join("\n")
}

export function buildContext(
  repoOwner: string,
  repoName: string,
  repoUrl: string,
  files: FileEntry[],
  fileTree: string
): ContextResult {
  const sortedFiles = prioritizeFiles(files)
  const languages = countLanguages(files)

  let context = `# Repository: ${repoOwner}/${repoName}\n\n`
  context += `## File Structure\n\`\`\`\n${fileTree}\n\`\`\`\n\n`
  context += `## Key Files\n\n`

  let estimatedTokens = Math.ceil(context.length / CHARS_PER_TOKEN)
  let filesIncluded = 0
  const topFiles: string[] = []

  for (const file of sortedFiles) {
    let content = file.content
    let truncatedNote = ""

    // Truncate large files
    if (content.length > MAX_FILE_SIZE) {
      content = content.slice(0, MAX_FILE_SIZE)
      truncatedNote = "\n\n[... file truncated at 50KB ...]"
    }

    const fileSection =
      `### ${file.path}\n` +
      `\`\`\`${file.language}\n${content}${truncatedNote}\n\`\`\`\n\n`

    const sectionTokens = Math.ceil(fileSection.length / CHARS_PER_TOKEN)

    if (estimatedTokens + sectionTokens > TOKEN_BUDGET) {
      // We've hit the budget
      return {
        context,
        metadata: {
          name: repoName,
          owner: repoOwner,
          url: repoUrl,
          defaultBranch: "main",
          fileCount: files.length,
          totalTokens: estimatedTokens,
          languages,
          topFiles,
        },
        estimatedTokens,
        filesIncluded,
        filesTotal: files.length,
        truncated: true,
      }
    }

    context += fileSection
    estimatedTokens += sectionTokens
    filesIncluded++
    if (topFiles.length < 10) {
      topFiles.push(file.path)
    }
  }

  return {
    context,
    metadata: {
      name: repoName,
      owner: repoOwner,
      url: repoUrl,
      defaultBranch: "main",
      fileCount: files.length,
      totalTokens: estimatedTokens,
      languages,
      topFiles,
    },
    estimatedTokens,
    filesIncluded,
    filesTotal: files.length,
    truncated: false,
  }
}
