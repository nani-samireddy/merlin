"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code2, Eye, ZoomIn, ZoomOut, RotateCcw, Plus, Send } from "lucide-react";

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
}

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mermaidCodes, setMermaidCodes] = useState<string[]>([
    `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`
  ])
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [tab, setTab] = useState("preview")
  const viewportRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [panning, setPanning] = useState(false)
  const panOrigin = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  // Initialize mermaid
  useEffect(() => {
    const initializeMermaid = async () => {
      const mermaid = (await import("mermaid")).default
      mermaid.initialize({
        startOnLoad: false,
        theme: "dark",
        securityLevel: "loose",
      })
    }
    initializeMermaid()
  }, [])

  // Render mermaid diagrams when code changes
  useEffect(() => {
    const renderDiagrams = async () => {
      if (!containerRef.current) return
      try {
        const mermaid = (await import("mermaid")).default
        containerRef.current.innerHTML = ""
        const diagramsContainer = document.createElement("div")
        diagramsContainer.className = "space-y-4"
        for (const [index, code] of mermaidCodes.entries()) {
          if (!code.trim()) continue
          const diagramContainer = document.createElement("div")
          diagramContainer.className = "bg-card border border-border rounded-lg p-4"
          try {
            const id = `mermaid-${Date.now()}-${index}`
            const { svg } = await mermaid.render(id, code)
            diagramContainer.innerHTML = svg
          } catch (error) {
            console.error(`Error rendering diagram ${index + 1}:`, error)
            diagramContainer.innerHTML =
              '<div class="text-red-500 p-4 border border-red-300/40 rounded">Error rendering diagram</div>'
          }
          diagramsContainer.appendChild(diagramContainer)
        }
        containerRef.current.appendChild(diagramsContainer)
      } catch (error) {
        console.error("Error initializing diagrams:", error)
        if (containerRef.current) {
          containerRef.current.innerHTML =
            '<div class="text-red-500 p-4 border border-red-300 rounded">Error initializing diagram renderer</div>'
        }
      }
    }
    renderDiagrams()
  }, [mermaidCodes])

  const sendPrompt = async () => {
    if (!prompt.trim()) {
      setError("Please enter a description for your diagram")
      return
    }
    setIsGenerating(true)
    setError("")
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: prompt.trim(),
    }
    setMessages((m) => [...m, userMsg])
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
      const data = await res.json()
      if (data.code) {
        const diagramBlocks = String(data.code)
          .split(/(?:```(?:mermaid)?\s*\n?|\n\s*\n\s*)/)
          .map((b: string) => b.trim())
          .filter(Boolean)
        if (diagramBlocks.length) setMermaidCodes(diagramBlocks)
        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Generated ${diagramBlocks.length || 1} diagram${diagramBlocks.length > 1 ? "s" : ""}. See Preview tab.`,
        }
        setMessages((m) => [...m, assistantMsg])
        setTab("preview")
      } else {
        throw new Error("No diagram code received")
      }
    } catch (e) {
      console.error("Generation error:", e)
      const message = e instanceof Error ? e.message : "Unknown error"
      setError(`Failed to generate diagram: ${message}`)
    } finally {
      setIsGenerating(false)
      setPrompt("")
    }
  }
  
  // Zoom and pan handlers
  const zoomBy = (factor: number) =>
    setScale((s) => Math.min(4, Math.max(0.25, s * factor)))
  const resetView = () => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }

  const onWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      e.preventDefault()
      zoomBy(e.deltaY > 0 ? 0.9 : 1.1)
    }
  }

  const onMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.button !== 0) return
    setPanning(true)
    panOrigin.current = { x: e.clientX - offset.x, y: e.clientY - offset.y }
  }
  const onMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!panning) return
    setOffset({ x: e.clientX - panOrigin.current.x, y: e.clientY - panOrigin.current.y })
  }
  const endPan = () => setPanning(false)

  const handleExampleDiagram = () => {
    setMermaidCodes([
      `flowchart TD
      A[User Input] --> B{Valid?}
      B -->|Yes| C[Process Data]
      B -->|No| D[Show Error]
      C --> E[Save to Database]
      D --> A
      E --> F[Display Success]`,
      `sequenceDiagram
      participant User
      participant System
      User->>System: Submit Form
      System->>System: Validate Input
      alt Valid Input
          System->>System: Process Data
          System->>System: Save to DB
          System-->>User: Show Success
      else Invalid Input
          System-->>User: Show Error
      end`,
    ])
    setTab("preview")
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Single App Header */}
      <nav className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground font-semibold">M</span>
          <div className="leading-tight">
            <div className="text-sm font-semibold">Merlin</div>
            <div className="text-[11px] text-muted-foreground">Mermaid Diagram Studio</div>
          </div>
        </div>
      </nav>
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Chat (30%) */}
        <aside className="flex basis-[30%] shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground min-w-[280px] max-w-[880px]">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-xs text-muted-foreground">
                Start a conversation to build your Mermaid diagram
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={
                  m.role === "user"
                    ? "ml-auto max-w-[85%] rounded-md bg-primary/10 px-3 py-2 text-sm"
                    : "mr-auto max-w-[85%] rounded-md bg-muted px-3 py-2 text-sm"
                }
              >
                {m.content}
              </div>
            ))}
          </div>
          <div className="border-t border-sidebar-border p-3 space-y-2">
            {error && (
              <div className="text-xs text-red-500">{error}</div>
            )}
            <div className="rounded-2xl border border-input bg-input/10 p-2">
              <Textarea
                rows={4}
                placeholder="Describe your diagram... (Shift+Enter for newline)"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    sendPrompt()
                  }
                }}
                onInput={(e) => {
                  const el = e.currentTarget
                  el.style.height = "0px"
                  const next = Math.min(el.scrollHeight, 300)
                  el.style.height = next + "px"
                }}
                disabled={isGenerating}
                className="border-0 bg-transparent shadow-none focus-visible:ring-0 min-h-[120px] max-h-[300px] resize-none px-3 py-2"
              />
              <div className="mt-1 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="ghost" title="Add" aria-label="Add">
                    <Plus className="size-4" />
                  </Button>
                </div>
                <Button
                  size="icon"
                  className="rounded-full"
                  onClick={sendPrompt}
                  disabled={isGenerating || !prompt.trim()}
                  title="Send"
                  aria-label="Send"
                >
                  <Send className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content (70%) */}
        <main className="basis-[70%] min-w-0 flex flex-col overflow-hidden">

          {/* Tabs */}
          <div className="flex-1 overflow-hidden p-4">
            <Tabs value={tab} onValueChange={setTab} className="h-full flex flex-col">
              <TabsList className="mb-3 w-fit">
                <TabsTrigger value="code" className="gap-2">
                  <Code2 className="size-4" /> Code
                </TabsTrigger>
                <TabsTrigger value="preview" className="gap-2">
                  <Eye className="size-4" /> Preview
                </TabsTrigger>
              </TabsList>
              <div className="flex-1 overflow-hidden">
                <TabsContent value="code" className="h-full">
                  <div className="flex h-full flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Edit Mermaid code. Separate multiple diagrams with '---'.
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="secondary" onClick={handleExampleDiagram}>Load example</Button>
                        <Button onClick={() => setTab("preview")}>Preview</Button>
                      </div>
                    </div>
                    <Textarea
                      className="font-mono text-sm min-h-[420px]"
                      value={mermaidCodes.map((c) => c.trim()).join("\n\n---\n\n")}
                      onChange={(e) => {
                        const diagrams = e.target.value
                          .split(/\n\s*---\s*\n/)
                          .map((d) => d.trim())
                          .filter(Boolean)
                        setMermaidCodes(diagrams)
                      }}
                      placeholder={"graph TD\n    A[Start] --> B[End]\n\n---\n\ngraph TD\n    C[Another] --> D[Diagram]"}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="preview" className="h-full">
                  <div className="h-full rounded-lg border bg-card relative">
                    <div className="absolute right-3 top-3 z-10 flex items-center gap-1">
                      <Button size="sm" variant="secondary" onClick={() => zoomBy(0.9)} title="Zoom out"><ZoomOut className="size-4"/></Button>
                      <Button size="sm" variant="secondary" onClick={() => zoomBy(1.1)} title="Zoom in"><ZoomIn className="size-4"/></Button>
                      <Button size="sm" variant="secondary" onClick={resetView} title="Reset view"><RotateCcw className="size-4"/></Button>
                    </div>
                    <div
                      ref={viewportRef}
                      onWheel={onWheel}
                      onMouseDown={onMouseDown}
                      onMouseMove={onMouseMove}
                      onMouseUp={endPan}
                      onMouseLeave={endPan}
                      className={"h-full w-full overflow-auto " + (panning ? "cursor-grabbing" : "cursor-grab")}
                    >
                      <div
                        ref={stageRef}
                        style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: "0 0" }}
                        className="min-w-fit min-h-fit p-4"
                      >
                        <div ref={containerRef} className="mermaid-container"/>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}
