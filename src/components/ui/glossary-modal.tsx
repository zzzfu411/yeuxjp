"use client"

import { Search } from "lucide-react"
import { GLOSSARY_CATEGORY_LABEL, type GlossaryCategory, type GlossaryEntry } from "@/data/glossary"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import { cn } from "@/lib/utils"
import { hasGlossaryMatches, type GlossaryCategoryMap } from "@/lib/glossary-model"

export function GlossaryModal({
  isOpen,
  activeId,
  query,
  byCategory,
  onClose,
  onQueryChange,
  onActivate,
  onShowAll,
}: {
  isOpen: boolean
  activeId: string | null
  query: string
  byCategory: GlossaryCategoryMap
  onClose: () => void
  onQueryChange: (value: string) => void
  onActivate: (id: string) => void
  onShowAll: () => void
}) {
  const hasMatches = hasGlossaryMatches(byCategory)
  const titleId = "glossary-modal-title"
  const descriptionId = "glossary-modal-description"

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-3xl h-[85vh] overflow-hidden"
      ariaLabelledBy={titleId}
      ariaDescribedBy={descriptionId}
    >
      <div className="flex flex-col h-full">
        <div className="p-6 border-b bg-muted/10 space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <div className="space-y-1">
              <h2 id={titleId} className="text-2xl font-bold tracking-tight">术语解释</h2>
              <p id={descriptionId} className="text-sm text-muted-foreground">
                点击术语可查看解释；不确定的时候，先看例句与对比。
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onShowAll} className="text-muted-foreground">
              查看全部
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="搜索术语（例如：清音 / 助词 / て形）"
              className="pl-9 bg-secondary/30 border-primary/20 focus-visible:ring-primary/50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-10">
          {hasMatches ? (
            (Object.keys(byCategory) as GlossaryCategory[]).map((category) => {
              const entries = byCategory[category]
              if (!entries.length) return null
              return (
                <GlossarySection
                  key={category}
                  category={category}
                  entries={entries}
                  activeId={activeId}
                  onActivate={onActivate}
                />
              )
            })
          ) : (
            <div className="rounded-xl border border-dashed bg-muted/20 px-6 py-10 text-center">
              <div className="text-base font-semibold">没有找到匹配术语</div>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                试试换一个关键词，或回到完整术语表继续浏览。
              </p>
              <Button variant="outline" className="mt-4 rounded-full" onClick={onShowAll}>
                查看全部
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

function GlossarySection({
  category,
  entries,
  activeId,
  onActivate,
}: {
  category: GlossaryCategory
  entries: GlossaryEntry[]
  activeId: string | null
  onActivate: (id: string) => void
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {GLOSSARY_CATEGORY_LABEL[category]}
        </h3>
        <div className="h-px bg-border flex-1" />
      </div>

      <div className="grid gap-4">
        {entries.map((entry) => (
          <GlossaryEntryCard
            key={entry.id}
            entry={entry}
            active={!!activeId && entry.id === activeId}
            onActivate={() => onActivate(entry.id)}
          />
        ))}
      </div>
    </section>
  )
}

function GlossaryEntryCard({
  entry,
  active,
  onActivate,
}: {
  entry: GlossaryEntry
  active: boolean
  onActivate: () => void
}) {
  return (
    <div
      id={`glossary-term-${entry.id}`}
      className={cn("rounded-xl border p-4 bg-card shadow-sm", active && "border-primary/50 bg-primary/5")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-lg font-bold">{entry.term}</div>
          <div className="text-sm text-muted-foreground leading-relaxed">{entry.short}</div>
        </div>
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onActivate}>
          定位
        </Button>
      </div>

      {entry.detail && (
        <div className="mt-3 text-sm text-foreground/80 leading-relaxed">{entry.detail}</div>
      )}

      {!!entry.examples?.length && (
        <div className="mt-4 space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">例子</div>
          <div className="grid gap-2">
            {entry.examples.map((example, index) => (
              <div key={index} className="rounded-lg bg-muted/30 border px-3 py-2 text-sm flex flex-col gap-1">
                <div className="font-medium">{example.jp}</div>
                {example.note && <div className="text-xs text-muted-foreground">{example.note}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
