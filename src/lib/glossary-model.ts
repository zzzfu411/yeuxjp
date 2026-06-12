import { GLOSSARY, type GlossaryCategory, type GlossaryEntry } from "@/data/glossary"

export type GlossaryCategoryMap = Record<GlossaryCategory, GlossaryEntry[]>

export function normalizeGlossaryQuery(text: string) {
  return text.trim().toLowerCase()
}

export function filterGlossaryEntries(query: string, entries: readonly GlossaryEntry[] = GLOSSARY) {
  const normalizedQuery = normalizeGlossaryQuery(query)
  if (!normalizedQuery) return [...entries]

  return entries.filter((entry) => {
    const haystack = [
      entry.term,
      entry.short,
      entry.detail ?? "",
      ...(entry.examples ?? []).flatMap((example) => [example.jp, example.note ?? ""]),
    ].join("\n")
    return normalizeGlossaryQuery(haystack).includes(normalizedQuery)
  })
}

export function groupGlossaryEntriesByCategory(entries: readonly GlossaryEntry[]): GlossaryCategoryMap {
  const grouped: GlossaryCategoryMap = {
    kana: [],
    pronunciation: [],
    grammar: [],
    levels: [],
  }

  for (const entry of entries) {
    grouped[entry.category].push(entry)
  }

  return grouped
}

export function hasGlossaryMatches(grouped: GlossaryCategoryMap) {
  return Object.values(grouped).some((entries) => entries.length > 0)
}
