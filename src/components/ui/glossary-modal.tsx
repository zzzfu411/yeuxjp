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
      className="paper-sheet flex h-[min(85vh,52rem)] max-w-3xl flex-col overflow-hidden border border-border/60 bg-card p-0 shadow-paper"
      ariaLabelledBy={titleId}
      ariaDescribedBy={descriptionId}
    >
      <div className="flex h-full flex-col">
        <div className="space-y-4 border-b border-border/50 px-5 pb-5 pt-6 sm:px-7">
          <div className="flex items-baseline justify-between gap-3">
            <div className="space-y-1">
              <p className="eyebrow">术语笺 · Glossary</p>
              <h2 id={titleId} className="inkline font-brush text-3xl">术语解释</h2>
              <p id={descriptionId} className="max-w-xl pt-1 text-sm leading-6 text-muted-foreground">
                点击术语可查看解释；不确定的时候，先看例句与对比。
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onShowAll}
              className="mr-9 shrink-0 rounded-none border-0 border-b border-dashed border-border/70 bg-transparent px-1 text-muted-foreground shadow-none hover:translate-y-0 hover:border-accent hover:bg-transparent hover:text-accent"
            >
              查看全部
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-1 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="搜索术语（例如：清音 / 助词 / て形）"
              className="rounded-none border-x-0 border-t-0 border-b border-border/60 bg-transparent pl-7 pr-1 shadow-none focus-visible:border-accent focus-visible:ring-0"
            />
          </div>
        </div>

        <div className="flex-1 space-y-10 overflow-y-auto px-5 py-7 sm:px-7">
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
            <div className="mx-auto max-w-lg border-y border-dashed border-border/60 px-6 py-10 text-center">
              <div className="seal-stamp">空</div>
              <div className="mt-4 text-base font-semibold">没有找到匹配术语</div>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                试试换一个关键词，或回到完整术语表继续浏览。
              </p>
              <Button
                variant="outline"
                className="mt-5 rounded-sm border-border/60 bg-transparent shadow-none hover:bg-muted/35"
                onClick={onShowAll}
              >
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
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <h3 className="eyebrow text-base">
          {GLOSSARY_CATEGORY_LABEL[category]}
        </h3>
        <div className="h-px flex-1 bg-border/60" />
      </div>

      <div className="grid">
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
      className={cn(
        "ledger-row border-b border-border/45 px-2 py-5",
        active && "border-accent/70 bg-accent/[0.045] pl-4"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="font-jp text-lg font-semibold">{entry.term}</div>
          <div className="text-sm leading-relaxed text-muted-foreground">{entry.short}</div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 rounded-none border-0 bg-transparent px-1 font-normal text-muted-foreground shadow-none hover:translate-y-0 hover:border-0 hover:bg-transparent hover:text-accent"
          onClick={onActivate}
        >
          定位
        </Button>
      </div>

      {entry.detail && (
        <div className="mt-3 text-sm leading-relaxed text-foreground/80">{entry.detail}</div>
      )}

      {!!entry.examples?.length && (
        <div className="mt-5 space-y-2 border-l border-border/60 pl-4">
          <div className="eyebrow text-sm">例子 · samples</div>
          <div className="grid gap-3">
            {entry.examples.map((example, index) => (
              <div key={index} className="flex flex-col gap-1 text-sm">
                <div className="font-jp font-medium">{example.jp}</div>
                {example.note && <div className="text-xs text-muted-foreground">{example.note}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
