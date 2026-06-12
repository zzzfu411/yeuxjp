"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { GLOSSARY, GLOSSARY_BY_ID, GLOSSARY_CATEGORY_LABEL, type GlossaryCategory } from "@/data/glossary"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type GlossaryContextValue = {
  openGlossary: (termId?: string) => void
}

const GlossaryContext = React.createContext<GlossaryContextValue | null>(null)

export function useGlossary() {
  return React.useContext(GlossaryContext)
}

function normalize(text: string) {
  return text.trim().toLowerCase()
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
    const q = normalize(query)
    if (!q) return GLOSSARY
    return GLOSSARY.filter((e) => {
      const hay = `${e.term}\n${e.short}\n${e.detail ?? ""}\n${(e.examples ?? []).map((x) => x.jp).join("\n")}`
      return normalize(hay).includes(q)
    })
  }, [query])

  const byCategory = React.useMemo(() => {
    const map: Record<GlossaryCategory, typeof filtered> = {
      kana: [],
      pronunciation: [],
      grammar: [],
      levels: [],
    }
    for (const e of filtered) map[e.category].push(e)
    return map
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

  return (
    <GlossaryContext.Provider value={ctxValue}>
      {children}

      <Modal isOpen={isOpen} onClose={close} className="max-w-3xl h-[85vh] overflow-hidden">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b bg-muted/10 space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight">术语解释</h2>
                <p className="text-sm text-muted-foreground">
                  点击术语可查看解释；不确定的时候，先看例句与对比。
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setActiveId(null)
                  setQuery("")
                }}
                className="text-muted-foreground"
              >
                查看全部
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索术语（例如：清音 / 助词 / て形）"
                className="pl-9 bg-secondary/30 border-primary/20 focus-visible:ring-primary/50"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-10">
            {(Object.keys(byCategory) as GlossaryCategory[]).map((cat) => {
              const list = byCategory[cat]
              if (!list.length) return null
              return (
                <section key={cat} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      {GLOSSARY_CATEGORY_LABEL[cat]}
                    </h3>
                    <div className="h-px bg-border flex-1" />
                  </div>

                  <div className="grid gap-4">
                    {list.map((entry) => {
                      const isActive = !!activeId && entry.id === activeId
                      return (
                        <div
                          key={entry.id}
                          id={`glossary-term-${entry.id}`}
                          className={cn(
                            "rounded-xl border p-4 bg-card shadow-sm",
                            isActive && "border-primary/50 bg-primary/5"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="text-lg font-bold">{entry.term}</div>
                              <div className="text-sm text-muted-foreground leading-relaxed">{entry.short}</div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground"
                              onClick={() => setActiveId(entry.id)}
                            >
                              定位
                            </Button>
                          </div>

                          {entry.detail && (
                            <div className="mt-3 text-sm text-foreground/80 leading-relaxed">{entry.detail}</div>
                          )}

                          {!!entry.examples?.length && (
                            <div className="mt-4 space-y-2">
                              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                例子
                              </div>
                              <div className="grid gap-2">
                                {entry.examples.map((ex, idx) => (
                                  <div
                                    key={idx}
                                    className="rounded-lg bg-muted/30 border px-3 py-2 text-sm flex flex-col gap-1"
                                  >
                                    <div className="font-medium">{ex.jp}</div>
                                    {ex.note && <div className="text-xs text-muted-foreground">{ex.note}</div>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </section>
              )
            })}
          </div>
        </div>
      </Modal>
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
