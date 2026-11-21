"use client"
import Link from "next/link"
import { Suspense, useMemo } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Pagination } from "@/components/ui/pagination"
import { filterReferenceEntries, readReferenceCatalogState, referenceContextHref, referenceResultPage, REFERENCE_PAGE_SIZE, type ReferenceCatalogState } from "@/lib/reference-catalog-model"

export type ReferenceCatalogEntry = { id: string; title: string; japanese: string; description: string; href: string }
type CatalogProps = { entries: ReferenceCatalogEntry[]; label: string }

export function ReferenceCatalog(props: CatalogProps) {
  return <Suspense fallback={<CatalogResults {...props} state={{ query: "", page: 1 }} />}>
    <ConnectedCatalog {...props} />
  </Suspense>
}

function ConnectedCatalog(props: CatalogProps) {
  const params = useSearchParams()
  const pathname = usePathname()
  const state = readReferenceCatalogState(params)
  const update = (next: ReferenceCatalogState, paginate: boolean) => {
    const href = referenceContextHref(pathname, next)
    if (paginate) window.history.pushState(null, "", href)
    else window.history.replaceState(null, "", href)
  }
  return <CatalogResults {...props} state={state} onChange={update} />
}

function CatalogResults({ entries, label, state, onChange }: CatalogProps & {
  state: ReferenceCatalogState
  onChange?: (state: ReferenceCatalogState, paginate: boolean) => void
}) {
  const filtered = useMemo(() => filterReferenceEntries(entries, state.query), [entries, state.query])
  const page = referenceResultPage(state.page, filtered.length)
  const context = { query: state.query, page }
  const changePage = (next: number) => {
    onChange?.({ ...state, page: next }, true)
    document.getElementById("reference-results")?.scrollIntoView({ block: "start" })
  }
  return <section aria-label={label}>
    <label className="mb-2 block text-sm font-medium" htmlFor="reference-search">搜索{label}</label>
    <Input id="reference-search" aria-label={`搜索${label}`} placeholder="输入日语表达、场景或中文关键词" value={state.query} disabled={!onChange}
      onChange={event => onChange?.({ query: event.target.value, page: 1 }, false)} />
    {state.query && <button type="button" className="mt-2 min-h-10 text-sm underline underline-offset-4" onClick={() => onChange?.({ query: "", page: 1 }, false)}>清除搜索</button>}
    <div id="reference-results" className="scroll-mt-24" data-testid="reference-results">
    <Pagination page={page} total={filtered.length} pageSize={REFERENCE_PAGE_SIZE} onChange={changePage} />
    <div className="divide-y divide-border/50">
      {filtered.slice((page - 1) * REFERENCE_PAGE_SIZE, page * REFERENCE_PAGE_SIZE).map(item => <Link key={item.id} href={referenceContextHref(item.href, context)} prefetch={false} className="block space-y-2 px-2 py-5 hover:bg-muted/40">
        <h2 className="text-lg font-semibold">{item.title}</h2>
        <p lang="ja" className="font-jp text-lg text-accent">{item.japanese}</p>
        <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
        <span className="block text-sm text-muted-foreground">查看详情 →</span>
      </Link>)}
    </div>
    {!filtered.length && <p role="status" className="py-10 text-center text-muted-foreground">没有匹配内容，试试更短的关键词或清除搜索。</p>}
    {filtered.length > REFERENCE_PAGE_SIZE && <Pagination page={page} total={filtered.length} pageSize={REFERENCE_PAGE_SIZE} onChange={changePage} />}
    </div>
  </section>
}
