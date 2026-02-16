export interface RepoMetadata {
  name: string
  owner: string
  url: string
  defaultBranch: string
  fileCount: number
  totalTokens: number
  languages: Record<string, number>
  topFiles: string[]
}

export interface FileEntry {
  path: string
  content: string
  language: string
  size: number
  priority: number
}

export interface IngestResponse {
  sessionId: string
  metadata: RepoMetadata
  tokenCount: number
  truncated: boolean
  filesIncluded: number
  filesTotal: number
}

export interface QueryRequest {
  sessionId: string
  query: string
  effort?: "low" | "medium" | "high" | "max"
}

export interface DiagramRequest {
  sessionId: string
  focus?: string
}

export interface DiagramNode {
  id: string
  label: string
  type: "module" | "component" | "util" | "config" | "test" | "entry"
  description: string
  filePath?: string
}

export interface DiagramEdge {
  source: string
  target: string
  label?: string
  type: "imports" | "extends" | "uses" | "configures"
}

export interface DiagramData {
  nodes: DiagramNode[]
  edges: DiagramEdge[]
  title: string
  description: string
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  thinking?: string
  codeRefs?: CodeReference[]
  timestamp: number
}

export interface CodeReference {
  file: string
  line?: number
  snippet?: string
}

export interface SessionData {
  context: string
  metadata: RepoMetadata
  messages: Array<{ role: "user" | "assistant"; content: string }>
  tokenCount: number
  createdAt: number
}
