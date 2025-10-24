"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

type TabsContextType = {
  value: string
  setValue: (v: string) => void
}

const TabsContext = React.createContext<TabsContextType | null>(null)

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string
  value?: string
  onValueChange?: (v: string) => void
}

export function Tabs({
  className,
  defaultValue,
  value: valueProp,
  onValueChange,
  children,
  ...props
}: TabsProps) {
  const [internal, setInternal] = React.useState<string>(defaultValue || "")
  const isControlled = valueProp !== undefined
  const value = isControlled ? (valueProp as string) : internal
  const setValue = (v: string) => {
    if (!isControlled) setInternal(v)
    onValueChange?.(v)
  }
  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export function TabsList({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex h-10 w-fit items-center justify-center rounded-md border border-border bg-muted p-1 text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

export function TabsTrigger({
  className,
  value,
  children,
  ...props
}: TabsTriggerProps) {
  const ctx = React.useContext(TabsContext)
  if (!ctx) throw new Error("TabsTrigger must be used within Tabs")
  const active = ctx.value === value
  return (
    <button
      onClick={() => ctx.setValue(value)}
      aria-selected={active}
      data-state={active ? "active" : "inactive"}
      className={cn(
        "inline-flex items-center justify-start whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs data-[state=inactive]:text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export interface TabsContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

export function TabsContent({ className, value, ...props }: TabsContentProps) {
  const ctx = React.useContext(TabsContext)
  if (!ctx) throw new Error("TabsContent must be used within Tabs")
  const show = ctx.value === value
  return (
    <div
      role="tabpanel"
      className={cn(show ? "block" : "hidden", className)}
      {...props}
    />
  )
}
