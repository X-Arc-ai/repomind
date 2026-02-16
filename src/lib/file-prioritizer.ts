import { FileEntry } from "@/types"

// Edge-compatible path utilities (paths are always POSIX `/` format)
function extname(filePath: string): string {
  const lastDot = filePath.lastIndexOf('.')
  const lastSlash = filePath.lastIndexOf('/')
  if (lastDot <= lastSlash + 1) return ''
  return filePath.slice(lastDot)
}

function basename(filePath: string): string {
  const lastSlash = filePath.lastIndexOf('/')
  return lastSlash === -1 ? filePath : filePath.slice(lastSlash + 1)
}

// Directories to completely exclude
const EXCLUDED_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  ".nuxt",
  ".output",
  "coverage",
  ".cache",
  "__pycache__",
  ".tox",
  "vendor",
  ".venv",
  "venv",
  "target",
  ".idea",
  ".vscode",
  ".DS_Store",
])

// Binary file extensions to exclude
const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".ico", ".svg", ".webp",
  ".mp3", ".mp4", ".wav", ".avi", ".mov", ".mkv",
  ".zip", ".tar", ".gz", ".bz2", ".rar", ".7z",
  ".woff", ".woff2", ".ttf", ".eot", ".otf",
  ".pdf", ".doc", ".docx", ".xls", ".xlsx",
  ".exe", ".dll", ".so", ".dylib",
  ".pyc", ".pyo", ".class", ".o", ".obj",
  ".lock", ".map",
])

// Language detection by extension
const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  ".ts": "typescript", ".tsx": "tsx", ".js": "javascript", ".jsx": "jsx",
  ".py": "python", ".rs": "rust", ".go": "go", ".java": "java",
  ".rb": "ruby", ".php": "php", ".c": "c", ".cpp": "cpp", ".h": "c",
  ".cs": "csharp", ".swift": "swift", ".kt": "kotlin", ".scala": "scala",
  ".html": "html", ".css": "css", ".scss": "scss", ".less": "less",
  ".json": "json", ".yaml": "yaml", ".yml": "yaml", ".toml": "toml",
  ".xml": "xml", ".md": "markdown", ".mdx": "mdx",
  ".sh": "bash", ".bash": "bash", ".zsh": "zsh",
  ".sql": "sql", ".graphql": "graphql", ".proto": "protobuf",
  ".dockerfile": "dockerfile", ".tf": "hcl",
  ".vue": "vue", ".svelte": "svelte",
}

// Priority tiers (lower = higher priority)
const PRIORITY_PATTERNS: Array<{ pattern: RegExp; priority: number }> = [
  // Tier 0: Documentation
  { pattern: /^readme(\.(md|txt|rst))?$/i, priority: 0 },
  { pattern: /^contributing(\.(md|txt|rst))?$/i, priority: 1 },
  { pattern: /^architecture(\.(md|txt|rst))?$/i, priority: 1 },
  { pattern: /^changelog(\.(md|txt|rst))?$/i, priority: 2 },

  // Tier 1: Package manifests
  { pattern: /^package\.json$/, priority: 3 },
  { pattern: /^cargo\.toml$/, priority: 3 },
  { pattern: /^go\.(mod|sum)$/, priority: 3 },
  { pattern: /^pyproject\.toml$/, priority: 3 },
  { pattern: /^requirements\.txt$/, priority: 3 },
  { pattern: /^gemfile$/i, priority: 3 },
  { pattern: /^pom\.xml$/, priority: 3 },
  { pattern: /^build\.gradle(\.kts)?$/, priority: 3 },
  { pattern: /^composer\.json$/, priority: 3 },

  // Tier 2: Config files
  { pattern: /^tsconfig(\..+)?\.json$/, priority: 5 },
  { pattern: /^next\.config\.(js|ts|mjs)$/, priority: 5 },
  { pattern: /^vite\.config\.(js|ts|mjs)$/, priority: 5 },
  { pattern: /^webpack\.config\.(js|ts)$/, priority: 5 },
  { pattern: /^\.env\.example$/, priority: 5 },
  { pattern: /^docker-compose\.ya?ml$/, priority: 5 },
  { pattern: /^dockerfile$/i, priority: 5 },
  { pattern: /^\.eslintrc/, priority: 7 },
  { pattern: /^\.prettierrc/, priority: 7 },
  { pattern: /^tailwind\.config/, priority: 6 },

  // Tier 3: Entry points
  { pattern: /^(index|main|app|server)\.(ts|js|tsx|jsx|py|go|rs)$/, priority: 8 },
  { pattern: /^src\/(index|main|app)\.(ts|js|tsx|jsx)$/, priority: 8 },
  { pattern: /^(routes|router|middleware)\.(ts|js)$/, priority: 10 },
  { pattern: /^(schema|models?|types?)\.(ts|js|py|go|rs)$/, priority: 10 },

  // Tier 4: Test files (lowest priority — include if budget allows)
  { pattern: /\.(test|spec)\.(ts|js|tsx|jsx|py)$/, priority: 50 },
  { pattern: /^test[s]?\//, priority: 50 },
  { pattern: /^__tests__\//, priority: 50 },
  { pattern: /^spec[s]?\//, priority: 50 },
]

export function shouldExcludePath(filePath: string): boolean {
  const parts = filePath.split('/')
  return parts.some((part) => EXCLUDED_DIRS.has(part))
}

export function isBinaryFile(filePath: string): boolean {
  const ext = extname(filePath).toLowerCase()
  return BINARY_EXTENSIONS.has(ext)
}

export function detectLanguage(filePath: string): string {
  const ext = extname(filePath).toLowerCase()
  if (ext === "" && basename(filePath).toLowerCase() === "dockerfile") {
    return "dockerfile"
  }
  return EXTENSION_TO_LANGUAGE[ext] || "text"
}

export function getFilePriority(filePath: string): number {
  const filename = basename(filePath).toLowerCase()
  const relativePath = filePath.toLowerCase()

  // Check priority patterns against filename and full path
  for (const { pattern, priority } of PRIORITY_PATTERNS) {
    if (pattern.test(filename) || pattern.test(relativePath)) {
      return priority
    }
  }

  // Default priority based on directory depth (shallower = higher priority)
  const depth = filePath.split('/').length
  return 20 + Math.min(depth * 2, 20)
}

export function prioritizeFiles(files: FileEntry[]): FileEntry[] {
  return [...files].sort((a, b) => {
    // Primary: priority score
    if (a.priority !== b.priority) return a.priority - b.priority
    // Secondary: file size (smaller first — more likely to be important modules)
    return a.size - b.size
  })
}

export function countLanguages(files: FileEntry[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const file of files) {
    counts[file.language] = (counts[file.language] || 0) + 1
  }
  return counts
}
