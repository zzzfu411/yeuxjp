"use client"

import { useState } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { useLearningProgress } from "@/lib/learning-progress"
import { useMistakeNotebook } from "@/lib/mistake-notebook"
import { useSrsDeck } from "@/lib/srs"
import { STORAGE_KEYS } from "@/lib/storage-keys"
import { getKanaById } from "@/lib/kana-id"
import { getUntestedCourseKanaIds, type CourseKanaDirection } from "@/lib/course-kana"

const KanaReviewSession = dynamic(() => import("@/components/review/kana-review-session").then(mod => mod.KanaReviewSession), {
  ssr: false, loading: () => <p className="paper-wrap py-12" role="status">正在加载补练…</p>,
})
export function CourseKanaPage({ lessonId, title, ids }: { lessonId: string; title: string; ids: string[] }) {
  const learning = useLearningProgress()
  const notebook = useMistakeNotebook()
  const srs = useSrsDeck(STORAGE_KEYS.SRS_KANA)
  const [session, setSession] = useState<{ ids: string[]; practice: boolean } | null>(null)
  const [direction, setDirection] = useState<CourseKanaDirection>("recognition")
  const untested = getUntestedCourseKanaIds(ids, learning.items, direction)
  const due = ids.filter(id => srs.dueIds.includes(id))
  if (session) return <KanaReviewSession {...session} practiceDirection={direction} onExit={() => setSession(null)} learning={learning} notebook={notebook} srs={srs} />
  return <div className="paper-wrap py-8 sm:py-12" data-testid="course-kana">
    <Link href={`/learn/${lessonId}`} className="text-sm underline underline-offset-4">返回课程</Link>
    <p className="eyebrow mt-6">本课假名补练</p>
    <h1 className="mt-2 text-2xl font-semibold leading-relaxed sm:text-3xl">{title}</h1>
    <p className="mt-4 text-base leading-8 text-muted-foreground">逐项练习本课假名，分别记录识读与听音。答错也算已测；完成课程、手动标记与旧汇总分数不能代替实际测验。选项可能包含其他假名。</p>
    {!learning.loaded || !notebook.loaded || !srs.loaded ? <p role="status" className="py-8">正在读取练习记录…</p> : !ids.length ? <p className="py-8">本课没有新增假名，可返回课程继续学习。</p> : <>
      <p className="my-6 leading-8" data-testid="course-kana-counts">共 {ids.length} 个 · 当前方向未测 {untested.length} 个 · 到期 {due.length} 个</p>
      <div className="flex flex-wrap items-end gap-3 border-y border-border py-5">
        <label className="grid gap-2 text-sm">补练方向<select value={direction} onChange={e => setDirection(e.target.value as CourseKanaDirection)} className="min-h-11 border border-border bg-background px-3 text-base">
          <option value="recognition">看假名 → 读音</option><option value="listening">听音 → 假名</option>
        </select></label>
        <Button disabled={!untested.length} onClick={() => setSession({ ids: untested, practice: true })} data-testid="course-kana-untested">补测未测假名（{untested.length}）</Button>
        <Button variant="outline" onClick={() => setSession({ ids, practice: true })} data-testid="course-kana-all">练全部假名</Button>
        <Button variant="outline" disabled={!due.length} onClick={() => setSession({ ids: due, practice: false })}>复习本课到期假名（{due.length}）</Button>
      </div>
      <ul className="divide-y divide-border" data-testid="course-kana-list">{ids.map(id => {
        const parsed = getKanaById(id)!
        return <li key={id} data-kana-id={id} className="flex items-center justify-between gap-3 py-5">
          <span lang="ja" className="font-jp text-3xl">{parsed.kana[parsed.script]}<span className="ml-3 text-base text-muted-foreground">{parsed.romaji}</span></span>
          <span className="text-sm">{untested.includes(id) ? "此方向尚未测评" : "此方向已有测评"}{due.includes(id) ? " · 待复习" : ""}</span>
        </li>
      })}</ul>
      <p className="mt-5 text-sm leading-7 text-muted-foreground">“已有测评”不等于掌握。听音题排除共通语中的同音写法互相干扰；识读题在提交前不播放读音。</p>
    </>}
  </div>
}
