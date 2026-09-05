"use client"
import { Button } from "@/components/ui/button"
export function Pagination({ page, total, pageSize, onChange }: { page: number; total: number; pageSize: number; onChange: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (!total) return null
  return <nav aria-label="结果分页" className="my-4 flex flex-wrap items-center justify-between gap-2 border-y border-border/40 py-3 text-sm">
    <span role="status">共 {total} 项 · {page}/{pages} 页</span>
    <div className="flex gap-2">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>上一页</Button>
      <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>下一页</Button>
    </div>
  </nav>
}
