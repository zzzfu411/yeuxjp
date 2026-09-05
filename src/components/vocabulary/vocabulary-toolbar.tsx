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
      <section className="mt-4 sm:mt-6" aria-label="词汇搜索">
        <div className="mx-auto w-full max-w-xl">
          <label htmlFor="vocabulary-ledger-search" className="eyebrow vocab-search-label">
            搜索词汇
          </label>
          <div className="relative mt-1">
            <Search className="absolute left-1 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              id="vocabulary-ledger-search"
              placeholder="搜索单词..."
              data-testid="vocabulary-search"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              className="anime-input h-11 w-full pl-8 pr-1 text-sm font-normal placeholder:text-muted-foreground/70"
            />
          </div>
        </div>
      </section>

      <section aria-label="词汇筛选" className="short-viewport-static lg:sticky lg:top-20 z-30 mt-4 space-y-2 border-y border-border/50 bg-[var(--paper)] py-2">
        <div className="scrollbar-hide flex items-end justify-start overflow-x-auto" aria-label="词汇等级">
          {levels.map((level) => (
            <button
              key={level.id}
              type="button"
              aria-pressed={currentLevel === level.id}
              data-testid={`vocabulary-level-${level.id}`}
              onClick={() => onLevelChange(level.id)}
              className={cn(
                "level-tab relative shrink-0 px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground",
                currentLevel === level.id
                  ? "is-selected font-semibold text-foreground"
                  : "font-normal"
              )}
              title={level.desc}
            >
              {level.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-start gap-x-2 gap-y-2 text-xs sm:gap-x-5 sm:text-sm">
          <div className="font-scribble mr-auto text-sm text-muted-foreground">
            掌握 {progress.learned} / {progress.total}
          </div>

          <button
            type="button"
            aria-pressed={onlyUnlearned}
            onClick={onToggleOnlyUnlearned}
            data-testid="vocabulary-only-unlearned"
            className={cn(
              "filter-chip px-2.5 py-1.5 text-muted-foreground transition-colors hover:text-foreground",
              onlyUnlearned && "is-selected text-foreground"
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
              "filter-chip px-2.5 py-1.5 text-muted-foreground transition-colors hover:text-foreground",
              showRomaji && "is-selected text-foreground"
            )}
          >
            罗马音：{showRomaji ? "显示" : "隐藏"}
          </button>

          <button
            type="button"
            onClick={onClearLearned}
            data-testid="vocabulary-clear-progress"
            className="filter-chip px-2.5 py-1.5 text-muted-foreground transition-colors hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            清空进度
          </button>
        </div>

        <div className="scrollbar-hide flex items-center gap-4 overflow-x-auto border-t border-border/35 pt-3">
          <button type="button" aria-pressed={!activeCategory} onClick={() => onSelectCategory("")} className="category-filter shrink-0 px-2 py-2 text-xs">全部分类</button>
          {categories.map((category) => {
            const withIcon = hasCategoryIcon(category)
            return (
              <button
                key={category}
                type="button"
                aria-pressed={activeCategory === category}
                onClick={() => onSelectCategory(category)}
                className={cn(
                  "category-filter inline-flex shrink-0 items-center gap-2 whitespace-nowrap px-2 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground",
                  activeCategory === category
                    ? "is-selected text-foreground"
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
