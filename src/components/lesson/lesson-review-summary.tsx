"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { Lesson } from "@/data/lesson-types"
import { buildLessonReviewSummary, type LessonReviewSummaryRow } from "@/lib/lesson-review-summary"
import { readLessonProgressMapResult } from "@/lib/learning-progress-storage"
import { readKnowledgeReviews } from "@/lib/knowledge-review-storage"
import { readMistakeListResult, MISTAKE_NOTEBOOK_EVENT } from "@/lib/mistake-notebook-storage"
import { readSrsMapResult, SRS_EVENT } from "@/lib/srs-storage"
import { STORAGE_KEYS } from "@/lib/storage-keys"
import { LEARNING_EVENT } from "@/lib/learning-storage"
import { LEARNING_STORE_EVENT } from "@/lib/learning-events"

const assessmentLabels = { unmeasured: "本课当前版本未测", practice: "本课仍需独立答对", correct: "本课已独立答对", reference: "本课仅接触，未单独测评" }

export function LessonReviewSummary({ lesson }: { lesson: Lesson }) {
  const [state, setState] = useState({ loaded: false, ok: true, rows: [] as LessonReviewSummaryRow[] })
  useEffect(() => {
    let active = true
    const sync = () => {
      if (!active) return
      const progress = readLessonProgressMapResult()
      const knowledge = readKnowledgeReviews()
      const mistakes = readMistakeListResult(STORAGE_KEYS.MISTAKES)
      const srs = readSrsMapResult(STORAGE_KEYS.SRS_MISTAKES)
      const ok = progress.ok && knowledge.ok && mistakes.ok && srs.ok
      setState({ loaded: true, ok, rows: ok ? buildLessonReviewSummary(lesson, progress.value[lesson.id], knowledge.value, mistakes.value, srs.value, Date.now()) : [] })
    }
    const storage = (event: StorageEvent) => {
      if (event.key === null || [STORAGE_KEYS.LESSON_PROGRESS, STORAGE_KEYS.KNOWLEDGE_REVIEWS, STORAGE_KEYS.MISTAKES, STORAGE_KEYS.SRS_MISTAKES].some(key => key === event.key)) sync()
    }
    queueMicrotask(sync)
    const timer = window.setInterval(sync, 30_000)
    window.addEventListener("storage", storage)
    window.addEventListener(LEARNING_EVENT, sync)
    window.addEventListener(LEARNING_STORE_EVENT, sync)
    window.addEventListener(MISTAKE_NOTEBOOK_EVENT, sync)
    window.addEventListener(SRS_EVENT, sync)
    return () => { active = false; clearInterval(timer); window.removeEventListener("storage", storage); window.removeEventListener(LEARNING_EVENT, sync); window.removeEventListener(LEARNING_STORE_EVENT, sync); window.removeEventListener(MISTAKE_NOTEBOOK_EVENT, sync); window.removeEventListener(SRS_EVENT, sync) }
  }, [lesson])
  if (!state.loaded) return <p role="status" className="mt-5 text-sm">正在读取本课复习状态…</p>
  if (!state.ok) return <p role="alert" data-testid="lesson-review-summary-error" className="mt-5 text-sm">本课复习记录暂时无法读取。原始数据保留，读取恢复后再显示测评与安排。</p>
  if (!state.rows.length) return null
  const scheduled = state.rows.filter(row => row.review !== "none").length
  return <section className="mt-5 border-t border-border/40 pt-5" data-testid="lesson-review-summary" aria-label="本课语法与句子复习状态">
    <h3 className="text-lg font-semibold">本课语法与句子</h3>
    <p className="mt-2 text-sm leading-7">已安排复习 {scheduled}/{state.rows.length} 项 · 当前未测或仅接触 {state.rows.filter(row => row.assessment === "unmeasured" || row.assessment === "reference").length} 项</p>
    <details className="mt-3">
      <summary className="cursor-pointer text-sm font-semibold">逐项查看测评和复习时间</summary>
      <ul className="mt-3 divide-y divide-border/40">{state.rows.map(row => <li key={row.id} className="py-3 text-sm leading-7" data-review-step={row.id}>
        <p className="font-semibold">{row.title}</p>
        <p>{assessmentLabels[row.assessment]}</p>
        <p className="text-muted-foreground">{row.dueAt !== undefined ? `${row.reviewSource === "mistake" ? "错题" : "语法／句子"}复习 · ${row.review === "due" ? "已到期" : "已安排"} · ${new Date(row.dueAt).toLocaleString("zh-CN")}` : "尚无本题复习安排；可回到补练，或查阅对应知识点。"}</p>
        {row.assessment === "reference" && <Link href={row.href} className="inline-block py-1 underline underline-offset-4">查阅与补练 →</Link>}
      </li>)}</ul>
    </details>
    <Link href="/review#knowledge-review-deck" className="mt-3 inline-block py-2 text-sm font-semibold underline underline-offset-4">进入到期复习 →</Link>
    <p className="mt-2 text-xs leading-6 text-muted-foreground">正确题也会安排间隔复习。这里分别列出本课作答与当前安排，不把一次正确当作长期掌握。</p>
  </section>
}
