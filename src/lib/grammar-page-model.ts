import type { GrammarPoint, Level } from "@/data/grammar-data"

export const GRAMMAR_LEVELS = ["N5", "N4", "N3", "N2", "N1", "Anime"] as const satisfies readonly Level[]

export function parseGrammarLevel(value: string | null | undefined): Level | null {
  if (!value) return null
  return (GRAMMAR_LEVELS as readonly string[]).includes(value) ? (value as Level) : null
}

export function filterGrammarPoints(items: readonly GrammarPoint[], searchQuery: string) {
  const query = searchQuery.trim().toLowerCase()
  if (!query) return [...items]

  return items.filter((point) => {
    return (
      point.title.toLowerCase().includes(query) ||
      point.explanation.toLowerCase().includes(query) ||
      point.structure.toLowerCase().includes(query) ||
      point.examples.some((example) => {
        return example.meaning.toLowerCase().includes(query) || example.japanese.includes(searchQuery.trim())
      })
    )
  })
}
