"use client"

import type { Vocabulary } from "@/data/vocabulary/types"
import { CategoryIcon } from "@/components/vocabulary/category-icon"
import { Flashcard } from "@/components/vocabulary/flashcard"
import { Button } from "@/components/ui/button"
import { findVocabularyIndex, getVocabularyItemsByCategory } from "@/lib/vocabulary-page-model"

interface VocabularyCategoryListProps {
  categories: string[]
  categoryNames: Record<string, string>
  items: Vocabulary[]
  loading: boolean
  error: string | null
  showRomaji?: boolean
  isLearnedId: (id: string) => boolean
  onExpand: (index: number) => void
  onRetry: () => void
}

export function VocabularyCategoryList({
  categories,
  categoryNames,
  items,
  loading,
  error,
  showRomaji = true,
  isLearnedId,
  onExpand,
  onRetry,
}: VocabularyCategoryListProps) {
  return (
    <div className="space-y-6 pt-3">
      {categories.map((category) => {
        const categoryItems = getVocabularyItemsByCategory(items, category)

        return (
          <section key={category} id={`cat-${category}`} className="paper-sheet vocab-category-panel relative scroll-mt-48 py-2">
            <span className="paper-tape" aria-hidden="true" />
            <header className="vocab-category-heading mb-3 flex items-center gap-3 border-b border-border/45 pb-2 sm:mb-4 sm:gap-4 sm:pb-4">
              <span className="hidden sm:block"><CategoryIcon category={category} size={44} /></span>
              <h2 className="min-w-0 text-lg font-semibold text-foreground sm:text-xl">
                <span className="inkline">{categoryNames[category] || category}</span>
              </h2>
              <span className="font-scribble ml-auto text-base text-muted-foreground">
                {categoryItems.length}
              </span>
            </header>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {categoryItems.map((vocab) => (
                <Flashcard
                  key={vocab.id}
                  vocab={vocab}
                  learned={isLearnedId(vocab.id)}
                  showRomaji={showRomaji}
                  onExpand={() => onExpand(findVocabularyIndex(items, vocab.id))}
                />
              ))}
            </div>
          </section>
        )
      })}

      {loading && (
        <div className="paper-slip relative mx-auto max-w-lg px-6 py-14 text-center text-muted-foreground">
          <span className="paper-tape" aria-hidden="true" />
          <span className="block text-sm font-bold">正在准备词汇卡...</span>
          <span className="mt-2 block text-sm">{"\u6b63\u5728\u52a0\u8f7d\u8bcd\u6c47..."}</span>
        </div>
      )}

      {!loading && error && (
        <div className="paper-slip relative mx-auto max-w-lg space-y-4 px-6 py-14 text-center text-muted-foreground">
          <span className="paper-tape" aria-hidden="true" />
          <div className="seal-stamp">再试</div>
          <div className="text-sm">{"\u8bcd\u6c47\u52a0\u8f7d\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002"}</div>
          <Button type="button" variant="outline" className="border border-border/60 bg-transparent shadow-none hover:bg-muted/40 hover:shadow-none" onClick={onRetry} data-testid="vocabulary-retry-load">
            {"\u91cd\u65b0\u52a0\u8f7d"}
          </Button>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="paper-slip relative mx-auto max-w-lg px-6 py-14 text-center text-muted-foreground">
          <span className="paper-tape" aria-hidden="true" />
          <span className="seal-stamp">空</span>
          <p className="mt-4 text-sm">{"\u8be5\u7b49\u7ea7\u6682\u65e0\u5339\u914d\u8bcd\u6c47\u3002"}</p>
        </div>
      )}
    </div>
  )
}
