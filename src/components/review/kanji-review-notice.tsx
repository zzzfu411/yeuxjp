"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useKanjiReadings } from "@/lib/use-kanji-readings"
import { isCurrentKanjiQuestion } from "@/lib/kanji-reading-model"
export function KanjiReviewNotice() {
  const data = useKanjiReadings()
  const [now, setNow] = useState(0)
  useEffect(() => { const sync = () => setNow(Date.now()); queueMicrotask(sync); const timer = setInterval(sync, 60_000); window.addEventListener("focus", sync); return () => { clearInterval(timer); window.removeEventListener("focus", sync) } }, [])
  const current = Object.values(data.store).filter(row => isCurrentKanjiQuestion(row.question))
  if (!data.loaded || (!current.length && !data.error)) return null
  return <aside className="my-6 border-y border-border py-4 text-sm leading-7" data-testid="kanji-review-notice">
    <p>{data.error ? "汉字读音记录暂时不可读，原数据已保留。" : `汉字读音专项：${current.filter(row => row.srs.dueAt <= now).length} 词到期，按阶段单独练习。`}</p>
    <Link className="underline underline-offset-4" href="/placement#kanji">查看汉字集合与复习入口 →</Link>
  </aside>
}
