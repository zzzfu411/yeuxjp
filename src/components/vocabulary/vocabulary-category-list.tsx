"use client"

import type { Vocabulary } from "@/data/vocabulary/types"
import { CategoryIcon } from "@/components/vocabulary/category-icon"
import { Flashcard } from "@/components/vocabulary/flashcard"
import { findVocabularyIndex, getVocabularyItemsByCategory } from "@/lib/vocabulary-page-model"

interface VocabularyCategoryListProps {
  categories: string[]
  categoryNames: Record<string, string>
  items: Vocabulary[]
  loading: boolean
  error: string | null
  isLearnedId: (id: string) => boolean
  onExpand: (index: number) => void
}

export function VocabularyCategoryList({
  categories,
  categoryNames,
  items,
  loading,
  error,
  isLearnedId,
  onExpand,
}: VocabularyCategoryListProps) {
  return (
    <div className="space-y-16 pt-4">
      {categories.map((category) => {
        const categoryItems = getVocabularyItemsByCategory(items, category)

        return (
          <div key={category} id={`cat-${category}`} className="space-y-6 scroll-mt-48">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-3 border-b pb-2">
              <CategoryIcon category={category} size={40} />
              {categoryNames[category] || category}
              <span className="text-xs font-normal text-muted-foreground ml-auto bg-secondary px-2 py-1 rounded-full">
                {categoryItems.length}
              </span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 justify-items-center">
              {categoryItems.map((vocab) => (
                <Flashcard
                  key={vocab.id}
                  vocab={vocab}
                  learned={isLearnedId(vocab.id)}
                  onExpand={() => onExpand(findVocabularyIndex(items, vocab.id))}
                />
              ))}
            </div>
          </div>
        )
      })}

      {loading && (
        <div className="text-center py-20 text-muted-foreground">
          {"\u6b63\u5728\u52a0\u8f7d\u8bcd\u6c47..."}
        </div>
      )}

      {!loading && error && (
        <div className="text-center py-20 text-muted-foreground">
          {"\u8bcd\u6c47\u52a0\u8f7d\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002"}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          {"\u8be5\u7b49\u7ea7\u6682\u65e0\u5339\u914d\u8bcd\u6c47\u3002"}
        </div>
      )}
    </div>
  )
}
