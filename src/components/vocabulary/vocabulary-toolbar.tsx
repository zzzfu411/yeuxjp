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
  onClearLearned: () => void
  onSelectCategory: (category: string) => void
}

export function VocabularyToolbar({
  levels,
  currentLevel,
  searchQuery,
  onlyUnlearned,
  activeCategory,
  categories,
  categoryNames,
  progress,
  onSearchChange,
  onLevelChange,
  onToggleOnlyUnlearned,
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

      <div className="sticky top-16 z-30 -mx-4 space-y-4 border-b bg-background/95 px-4 py-4 shadow-sm backdrop-blur transition-all sm:mx-0 sm:rounded-xl sm:border-none sm:px-0">
        <div className="flex justify-center">
          <div className="inline-flex rounded-full bg-secondary/50 p-1">
            {levels.map((level) => (
              <button
                key={level.id}
                data-testid={`vocabulary-level-${level.id}`}
                onClick={() => onLevelChange(level.id)}
                className={cn(
                  "rounded-full px-6 py-2 text-sm font-medium transition-all",
                  currentLevel === level.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
          <div className="rounded-full border bg-secondary/50 px-3 py-1 font-mono text-xs text-muted-foreground">
            Progress: {progress.learned}/{progress.total}
          </div>

          <button
            onClick={onToggleOnlyUnlearned}
            className={cn(
              "rounded-full border bg-background px-4 py-2 transition-colors hover:bg-secondary/60",
              onlyUnlearned && "border-primary/40 bg-primary/5"
            )}
          >
            {onlyUnlearned ? "显示全部" : "只看未掌握"}
          </button>

          <button
            onClick={onClearLearned}
            className="rounded-full border bg-background px-4 py-2 text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
          >
            清空进度
          </button>
        </div>

        <div className="mask-fade scrollbar-hide flex items-center gap-2 overflow-x-auto pb-2">
          {categories.map((category) => {
            const withIcon = hasCategoryIcon(category)
            return (
              <button
                key={category}
                onClick={() => onSelectCategory(category)}
                className={cn(
                  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border text-xs font-medium transition-all hover:shadow-sm",
                  withIcon ? "py-1 pl-1 pr-3" : "px-4 py-1.5",
                  activeCategory === category
                    ? "scale-105 border-primary bg-primary/10 font-bold text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/50"
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
