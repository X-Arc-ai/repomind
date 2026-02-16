"use client"

import { Handle, Position } from "@xyflow/react"

const typeColors: Record<string, string> = {
  module: "bg-blue-500",
  component: "bg-green-500",
  util: "bg-yellow-500",
  config: "bg-purple-500",
  test: "bg-gray-500",
  entry: "bg-red-500",
}

const typeLabels: Record<string, string> = {
  module: "Module",
  component: "Component",
  util: "Utility",
  config: "Config",
  test: "Test",
  entry: "Entry",
}

interface ModuleNodeData {
  label: string
  nodeType: string
  description: string
}

export function ModuleNode({ data }: { data: ModuleNodeData }) {
  return (
    <div className="px-4 py-3 rounded-lg border bg-card shadow-sm min-w-[180px] max-w-[240px]">
      <Handle type="target" position={Position.Top} className="!bg-primary" />
      <div className="flex items-center gap-2 mb-1">
        <div
          className={`w-2.5 h-2.5 rounded-full ${typeColors[data.nodeType] || "bg-gray-500"}`}
        />
        <span className="font-medium text-sm truncate">{data.label}</span>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2">
        {data.description}
      </p>
      <div className="mt-1">
        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
          {typeLabels[data.nodeType] || data.nodeType}
        </span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-primary" />
    </div>
  )
}
