import type { Kana } from "@/data/kana-data"
import { getAnimCjkKanaUrls } from "@/lib/animcjk"

export type StrokeAvailability = "unknown" | "available" | "missing"
export type KanaGridColumns = 3 | 5

export function cacheKeyForChar(char: string) {
  return Array.from(char).join("")
}

export async function checkStrokeAvailability(
  char: string,
  fetcher: typeof fetch = fetch
) {
  const urls = getAnimCjkKanaUrls(char)
  if (!urls.length) return false

  const results = await Promise.all(
    urls.map(async (url) => {
      try {
        const response = await fetcher(url, { method: "HEAD", cache: "force-cache" })
        if (response.ok) return true
        if (response.status !== 405) return false

        const fallback = await fetcher(url, { cache: "force-cache" })
        return fallback.ok
      } catch {
        return false
      }
    })
  )

  return results.every(Boolean)
}

export function prefetchStrokeSvgs(char: string, fetcher: typeof fetch = fetch) {
  for (const url of getAnimCjkKanaUrls(char)) {
    fetcher(url, { cache: "force-cache" }).catch(() => undefined)
  }
}

export function getAdjacentKanaIndexes(selectedIndex: number | null, length: number) {
  if (selectedIndex === null || length <= 0) return []
  return Array.from(new Set([
    selectedIndex,
    (selectedIndex + 1) % length,
    (selectedIndex - 1 + length) % length,
  ]))
}

export function getKanaGridRowContent(data: Kana[], rowName: string, columns: KanaGridColumns): Array<Kana | null> {
  const rowKana = data.filter((item) => item.row === rowName)

  if (columns === 5 && rowName === "ya") {
    return [
      rowKana.find((item) => item.romaji === "ya") ?? null,
      null,
      rowKana.find((item) => item.romaji === "yu") ?? null,
      null,
      rowKana.find((item) => item.romaji === "yo") ?? null,
    ]
  }

  if (columns === 5 && rowName === "wa") {
    return [
      rowKana.find((item) => item.romaji === "wa") ?? null,
      null,
      null,
      null,
      rowKana.find((item) => item.romaji === "wo") ?? null,
    ]
  }

  if (columns === 5 && rowName === "n") {
    return [rowKana[0] ?? null, null, null, null, null]
  }

  return rowKana
}
