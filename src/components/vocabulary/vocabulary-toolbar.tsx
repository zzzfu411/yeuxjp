"use client"

import { Search } from "lucide-react"
import type { VocabLevel } from "@/data/vocabulary/types"
import { CategoryIcon, hasCategoryIcon } from "@/components/vocabulary/category-icon"
import { cn } from "@/lib/utils"

export interface VocabularyLevelOption {
  id: VocabLevel
  label: string
  desc: string
}

export interface VocabularyToolbarProps {
  levels: readonly VocabularyLevelOption[]
  currentLevel: VocabLevel
  searchQuery: string
  onlyUnlearned: boolean
  showRomaji: boolean
  activeCategory: string | null
  categories: readonly string[]
  categoryNames: Record<string, string>
  progress: {
    learned: number
    total: number
  }
  onSearchChange: (value: string) => void
  onLevelChange: (level: VocabLevel) => void
  onToggleOnlyUnlearned: () => void
  onToggleShowRomaji: () => void
  onClearLearned: () => void
  onSelectCategory: (category: string) => void
}

export function VocabularyToolbar({
  levels,
  currentLevel,
  searchQuery,
  onlyUnlearned,
  showRomaji,
  activeCategory,
  categories,
  categoryNames,
  progress,
  onSearchChange,
  onLevelChange,
  onToggleOnlyUnlearned,
  onToggleShowRomaji,
  onClearLearned,
  onSelectCategory,
}: VocabularyToolbarProps) {
  return (
    <>
      <section className="mt-9" aria-label="词汇搜索">
        <div className="mx-auto w-full max-w-xl">
          <label htmlFor="vocabulary-ledger-search" className="eyebrow">
            检索 · Search
          </label>
          <div className="relative mt-1">
            <Search className="absolute left-1 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              id="vocabulary-ledger-search"
              placeholder="搜索单词..."
              data-testid="vocabulary-search"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              className="h-11 w-full rounded-none border-x-0 border-t-0 border-b border-border/70 bg-transparent pl-8 pr-1 text-sm font-normal shadow-none outline-none placeholder:text-muted-foreground/70 focus:border-accent focus-visible:outline-none"
            />
          </div>
        </div>
      </section>

      <section aria-label="词汇筛选" className="short-viewport-static sticky top-20 z-30 -mx-4 mt-7 space-y-4 border-y border-border/50 bg-card/95 px-4 py-4 backdrop-blur-[2px] sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12">
        <div className="scrollbar-hide flex items-end justify-start overflow-x-auto" aria-label="词汇等级">
          {levels.map((level) => (
            <button
              key={level.id}
              type="button"
              aria-pressed={currentLevel === level.id}
              data-testid={`vocabulary-level-${level.id}`}
              onClick={() => onLevelChange(level.id)}
              className={cn(
                "relative shrink-0 px-4 py-2 text-sm text-muted-foreground transition-colors after:absolute after:inset-x-3 after:bottom-0 after:h-px after:bg-transparent after:content-[''] hover:text-foreground",
                currentLevel === level.id
                  ? "font-semibold text-foreground after:bg-accent"
                  : "font-normal"
              )}
              title={level.desc}
            >
              {level.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm sm:justify-start">
          <div className="font-scribble mr-auto text-base text-muted-foreground">
            掌握 {progress.learned} / {progress.total}
          </div>

          <button
            type="button"
            aria-pressed={onlyUnlearned}
            onClick={onToggleOnlyUnlearned}
            data-testid="vocabulary-only-unlearned"
            className={cn(
              "border-b border-dashed border-border/70 px-1 py-1 text-muted-foreground transition-colors hover:border-foreground hover:text-foreground",
              onlyUnlearned && "border-accent text-accent"
            )}
          >
            {onlyUnlearned ? "显示全部" : "只看未掌握"}
          </button>

          <button
            type="button"
            aria-pressed={showRomaji}
            aria-label="显示罗马音"
            onClick={onToggleShowRomaji}
            data-testid="vocabulary-toggle-romaji"
            title="熟悉假名后建议隐藏罗马音，训练直接读假名"
            className={cn(
              "border-b border-dashed border-border/70 px-1 py-1 text-muted-foreground transition-colors hover:border-foreground hover:text-foreground",
              showRomaji && "border-accent text-accent"
            )}
          >
            罗马音：{showRomaji ? "显示" : "隐藏"}
          </button>

          <button
            type="button"
            onClick={onClearLearned}
            data-testid="vocabulary-clear-progress"
            className="border-b border-dashed border-border/70 px-1 py-1 text-muted-foreground transition-colors hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
          >
            清空进度
          </button>
        </div>

        <div className="scrollbar-hide flex items-center gap-4 overflow-x-auto border-t border-border/35 pt-3">
          {categories.map((category) => {
            const withIcon = hasCategoryIcon(category)
            return (
              <button
                key={category}
                type="button"
                aria-pressed={activeCategory === category}
                onClick={() => onSelectCategory(category)}
                className={cn(
                  "ledger-row inline-flex shrink-0 items-center gap-2 whitespace-nowrap border-b border-border/50 px-1 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground",
                  activeCategory === category
                    ? "border-accent text-accent"
                    : ""
                )}
              >
                {withIcon && <CategoryIcon category={category} size={24} fallback={false} />}
                {categoryNames[category] || category}
              </button>
            )
          })}
        </div>
      </section>
    </>
  )
}
