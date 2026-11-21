export const REFERENCE_PAGE_SIZE = 12

export type ReferenceCatalogState = { query: string; page: number }
type SearchValues = { get: (name: string) => string | null }

export function readReferenceCatalogState(params: SearchValues): ReferenceCatalogState {
  const rawPage = params.get("page") ?? "1"
  const page = /^\d+$/.test(rawPage) ? Number(rawPage) : 1
  return { query: params.get("q") ?? "", page: Number.isSafeInteger(page) && page > 0 ? page : 1 }
}

export function referenceContextHref(href: string, state: ReferenceCatalogState) {
  const [path, hash] = href.split("#", 2)
  const [pathname, search] = path.split("?", 2)
  const params = new URLSearchParams(search)
  if (state.query) params.set("q", state.query)
  else params.delete("q")
  if (state.page > 1) params.set("page", String(state.page))
  else params.delete("page")
  const suffix = params.toString()
  return `${pathname}${suffix ? `?${suffix}` : ""}${hash ? `#${hash}` : ""}`
}

export function filterReferenceEntries<T extends { title: string; japanese: string; description: string }>(entries: readonly T[], query: string) {
  const terms = query.trim().normalize("NFKC").toLowerCase().split(/\s+/)
  return entries.filter(item => terms.every(term => `${item.title} ${item.japanese} ${item.description}`.normalize("NFKC").toLowerCase().includes(term)))
}

export function referenceResultPage(requestedPage: number, total: number) {
  return Math.min(requestedPage, Math.max(1, Math.ceil(total / REFERENCE_PAGE_SIZE)))
}
