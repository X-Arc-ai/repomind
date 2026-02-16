"use client"

import { useState, useCallback, useMemo } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import dagre from "@dagrejs/dagre"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, RefreshCw, Network } from "lucide-react"
import { DiagramData } from "@/types"
import { ModuleNode } from "./diagram-node"

const nodeTypes = { moduleNode: ModuleNode }

const edgeColors: Record<string, string> = {
  imports: "#6366f1",
  extends: "#10b981",
  uses: "#f59e0b",
  configures: "#8b5cf6",
}

function layoutDiagram(data: DiagramData) {
  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: "TB", nodesep: 80, ranksep: 100 })

  data.nodes.forEach((node) => {
    g.setNode(node.id, { width: 220, height: 70 })
  })

  data.edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target)
  })

  dagre.layout(g)

  const nodes: Node[] = data.nodes.map((node) => {
    const pos = g.node(node.id)
    return {
      id: node.id,
      type: "moduleNode",
      data: {
        label: node.label,
        nodeType: node.type,
        description: node.description,
      },
      position: { x: (pos?.x || 0) - 110, y: (pos?.y || 0) - 35 },
    }
  })

  const edges: Edge[] = data.edges.map((edge, i) => ({
    id: `e-${i}`,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    animated: edge.type === "uses",
    style: { stroke: edgeColors[edge.type] || "#666" },
    labelStyle: { fontSize: 10, fill: "#888" },
  }))

  return { nodes, edges }
}

interface ArchitectureDiagramProps {
  sessionId: string | null
}

export function ArchitectureDiagram({ sessionId }: ArchitectureDiagramProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [focus, setFocus] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [diagramTitle, setDiagramTitle] = useState("")
  const [diagramDesc, setDiagramDesc] = useState("")

  const generateDiagram = useCallback(async () => {
    if (!sessionId) return
    setIsLoading(true)
    setError("")

    try {
      const res = await fetch("/api/diagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, focus: focus || undefined }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate diagram")
      }

      const { nodes: layoutNodes, edges: layoutEdges } = layoutDiagram(data)
      setNodes(layoutNodes)
      setEdges(layoutEdges)
      setDiagramTitle(data.title)
      setDiagramDesc(data.description)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Diagram generation failed")
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, focus, setNodes, setEdges])

  if (!sessionId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">
          Load a repository to generate diagrams
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b space-y-2">
        <div className="flex gap-2">
          <Input
            placeholder="Focus area (optional, e.g. 'routing system')"
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={generateDiagram} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : nodes.length > 0 ? (
              <RefreshCw className="h-4 w-4 mr-1" />
            ) : (
              <Network className="h-4 w-4 mr-1" />
            )}
            {nodes.length > 0 ? "Regenerate" : "Generate"}
          </Button>
        </div>
        {diagramTitle && (
          <div>
            <p className="text-sm font-medium">{diagramTitle}</p>
            <p className="text-xs text-muted-foreground">{diagramDesc}</p>
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <div className="flex-1 relative">
        {nodes.length > 0 ? (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.1}
            maxZoom={2}
          >
            <Background />
            <Controls />
            <MiniMap
              nodeStrokeWidth={3}
              className="!bg-background !border-border"
            />
          </ReactFlow>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Network className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {isLoading
                  ? "Analyzing codebase architecture..."
                  : "Click Generate to create an architecture diagram"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
