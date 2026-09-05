"use client"
import Link from "next/link"
import { useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Pagination } from "@/components/ui/pagination"

export type ReferenceCatalogEntry = { id: string; title: string; japanese: string; description: string; href: string }
const PAGE_SIZE = 12
export function ReferenceCatalog({ entries, label }: { entries: ReferenceCatalogEntry[]; label: string }) {
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const filtered = useMemo(() => {
    const terms = query.trim().normalize("NFKC").toLowerCase().split(/\s+/)
    return entries.filter(item => terms.every(term => `${item.title} ${item.japanese} ${item.description}`.normalize("NFKC").toLowerCase().includes(term)))
  }, [entries, query])
  return <section aria-label={label}>
    <Input aria-label={`搜索${label}`} placeholder="输入日语表达、场景或中文关键词" value={query} onChange={event => { setQuery(event.target.value); setPage(1) }} />
    <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
    <div className="divide-y divide-border/50">
      {filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(item => <Link key={item.id} href={item.href} prefetch={false} className="block space-y-2 px-2 py-5 hover:bg-muted/40">
        <h2 className="text-lg font-semibold">{item.title}</h2>
        <p lang="ja" className="font-jp text-lg text-accent">{item.japanese}</p>
        <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
        <span className="block text-sm text-muted-foreground">查看详情 →</span>
      </Link>)}
    </div>
    {!filtered.length && <p role="status" className="py-10 text-center text-muted-foreground">没有匹配内容，试试更短的关键词。</p>}
    <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={value => { setPage(value); window.scrollTo({ top: 0 }) }} />
  </section>
}
