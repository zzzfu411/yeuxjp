"use client"

import { Search } from "lucide-react"
import type { VocabLevel } from "@/data/vocabulary/types"
import { Input } from "@/components/ui/input"
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
      <div className="relative mx-auto w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="搜索单词..."
          data-testid="vocabulary-search"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          className="border-primary/20 bg-secondary/30 pl-9 focus-visible:ring-primary/50"
        />
      </div>

      <div className="sticky top-20 z-30 -mx-4 space-y-4 border-b-[3px] border-foreground bg-background px-4 py-4 sm:mx-0 sm:px-0">
        <div className="flex flex-wrap justify-center">
          {levels.map((level, index) => (
            <button
              key={level.id}
              type="button"
              aria-pressed={currentLevel === level.id}
              data-testid={`vocabulary-level-${level.id}`}
              onClick={() => onLevelChange(level.id)}
              className={cn(
                "border-[3px] border-foreground px-5 py-2 text-sm font-extrabold",
                index > 0 && "-ml-[3px]",
                currentLevel === level.id
                  ? "z-[1] bg-foreground text-background dark:bg-primary dark:text-primary-foreground"
                  : "bg-card hover:bg-primary"
              )}
            >
              {level.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
          <div className="hard-chip px-3 py-1 font-mono text-xs text-muted-foreground">
            进度：{progress.learned}/{progress.total}
          </div>

          <button
            type="button"
            aria-pressed={onlyUnlearned}
            onClick={onToggleOnlyUnlearned}
            data-testid="vocabulary-only-unlearned"
            className={cn(
              "hard-chip px-4 py-2 hover:bg-primary",
              onlyUnlearned && "bg-primary"
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
              "hard-chip px-4 py-2 hover:bg-primary",
              showRomaji && "bg-primary"
            )}
          >
            罗马音：{showRomaji ? "显示" : "隐藏"}
          </button>

          <button
            type="button"
            onClick={onClearLearned}
            data-testid="vocabulary-clear-progress"
            className="hard-chip px-4 py-2 text-muted-foreground hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
          >
            清空进度
          </button>
        </div>

        <div className="scrollbar-hide flex items-center gap-0 overflow-x-auto pb-2">
          {categories.map((category, index) => {
            const withIcon = hasCategoryIcon(category)
            return (
              <button
                key={category}
                type="button"
                aria-pressed={activeCategory === category}
                onClick={() => onSelectCategory(category)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap border-[2px] border-foreground text-xs font-extrabold",
                  withIcon ? "py-1 pl-1 pr-3" : "px-4 py-1.5",
                  index > 0 && "-ml-[2px]",
                  activeCategory === category
                    ? "z-[1] bg-primary"
                    : "bg-card text-muted-foreground hover:bg-primary/40"
                )}
              >
                {withIcon && <CategoryIcon category={category} size={20} fallback={false} />}
                {categoryNames[category] || category}
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
