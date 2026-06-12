"use client"

import * as React from "react"
import { GLOSSARY_BY_ID } from "@/data/glossary"
import { Button } from "@/components/ui/button"
import { GlossaryModal } from "@/components/ui/glossary-modal"
import { filterGlossaryEntries, groupGlossaryEntriesByCategory } from "@/lib/glossary-model"
import { cn } from "@/lib/utils"

type GlossaryContextValue = {
  openGlossary: (termId?: string) => void
}

const GlossaryContext = React.createContext<GlossaryContextValue | null>(null)

export function useGlossary() {
  return React.useContext(GlossaryContext)
}

export function GlossaryProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [query, setQuery] = React.useState("")

  const openGlossary = React.useCallback((termId?: string) => {
    setActiveId(termId ?? null)
    setQuery("")
    setIsOpen(true)
  }, [])

  const close = React.useCallback(() => setIsOpen(false), [])

  const filtered = React.useMemo(() => {
    return filterGlossaryEntries(query)
  }, [query])

  const byCategory = React.useMemo(() => {
    return groupGlossaryEntriesByCategory(filtered)
  }, [filtered])

  React.useEffect(() => {
    if (!isOpen) return
    if (!activeId) return
    if (query) return

    const timer = setTimeout(() => {
      const el = document.getElementById(`glossary-term-${activeId}`)
      el?.scrollIntoView({ block: "start", behavior: "smooth" })
    }, 0)

    return () => clearTimeout(timer)
  }, [activeId, isOpen, query])

  const ctxValue = React.useMemo<GlossaryContextValue>(() => ({ openGlossary }), [openGlossary])
  const showAll = React.useCallback(() => {
    setActiveId(null)
    setQuery("")
  }, [])

  return (
    <GlossaryContext.Provider value={ctxValue}>
      {children}

      <GlossaryModal
        isOpen={isOpen}
        activeId={activeId}
        query={query}
        byCategory={byCategory}
        onClose={close}
        onQueryChange={setQuery}
        onActivate={setActiveId}
        onShowAll={showAll}
      />
    </GlossaryContext.Provider>
  )
}

export function GlossaryButton({
  termId,
  children,
  className,
}: {
  termId?: string
  children?: React.ReactNode
  className?: string
}) {
  const ctx = useGlossary()
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn("text-muted-foreground hover:text-foreground", className)}
      onClick={() => ctx?.openGlossary(termId)}
    >
      {children ?? "术语解释"}
    </Button>
  )
}

export function GlossaryTerm({
  termId,
  children,
  className,
}: {
  termId: string
  children?: React.ReactNode
  className?: string
}) {
  const ctx = useGlossary()
  const fallback = children ?? GLOSSARY_BY_ID[termId]?.term ?? termId

  if (!ctx) {
    return <span className={className}>{fallback}</span>
  }

  return (
    <button
      type="button"
      onClick={() => ctx.openGlossary(termId)}
      className={cn(
        "inline-flex items-center rounded-sm px-0.5 underline decoration-dotted underline-offset-4",
        "text-primary/90 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        className
      )}
      aria-label={`解释：${GLOSSARY_BY_ID[termId]?.term ?? termId}`}
    >
      {fallback}
    </button>
  )
}
