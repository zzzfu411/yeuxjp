import type { Vocabulary } from "@/data/vocabulary/types"

export function filterVocabularyItems({
  items,
  searchQuery,
  onlyUnlearned,
  isLearned,
}: {
  items: Vocabulary[]
  searchQuery: string
  onlyUnlearned: boolean
  isLearned: (id: string) => boolean
}) {
  const query = searchQuery.trim()
  const loweredQuery = query.toLowerCase()

  return items
    .filter((item) => {
      if (!query) return true
      return (
        item.kana.includes(query) ||
        (item.kanji?.includes(query) ?? false) ||
        item.romaji.toLowerCase().includes(loweredQuery) ||
        item.meaning.toLowerCase().includes(loweredQuery)
      )
    })
    .filter((item) => (onlyUnlearned ? !isLearned(item.id) : true))
}

export function getVocabularyCategories(items: Vocabulary[]) {
  return Array.from(new Set(items.map((item) => item.category)))
}

export function getVocabularyProgress(items: Vocabulary[], isLearned: (id: string) => boolean) {
  return {
    learned: items.reduce((total, item) => total + (isLearned(item.id) ? 1 : 0), 0),
    total: items.length,
  }
}

export function findVocabularyIndex(items: Vocabulary[], id: string) {
  return items.findIndex((item) => item.id === id)
}

export function getVocabularyItemsByCategory(items: Vocabulary[], category: string) {
  return items.filter((item) => item.category === category)
}
