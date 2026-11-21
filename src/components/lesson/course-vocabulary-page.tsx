"use client"

import { useState } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { useLearningProgress } from "@/lib/learning-progress"
import { useMistakeNotebook } from "@/lib/mistake-notebook"
import { useSrsDeck } from "@/lib/srs"
import { STORAGE_KEYS } from "@/lib/storage-keys"
import { useVocabularyReviewPool } from "@/components/review/review-vocabulary"
import { getCourseVocabularyStatus } from "@/lib/course-vocabulary"
import type { VocabReviewDirection } from "@/lib/review-questions"

const VocabReviewSession = dynamic(() => import("@/components/review/vocab-review-session").then(mod => mod.VocabReviewSession), {
  ssr: false, loading: () => <p className="paper-wrap py-12" role="status">正在加载补练…</p>,
})

export function CourseVocabularyPage({ lessonId, title, ids }: { lessonId: string; title: string; ids: string[] }) {
  const learning = useLearningProgress()
  const notebook = useMistakeNotebook()
  const srs = useSrsDeck(STORAGE_KEYS.SRS_VOCAB)
  const vocabulary = useVocabularyReviewPool(ids, ids.length > 0)
  const [session, setSession] = useState<{ ids: string[]; practice: boolean; direction?: VocabReviewDirection } | null>(null)
  const [direction, setDirection] = useState<VocabReviewDirection>("meaning")
  const loaded = learning.loaded && notebook.loaded && srs.loaded && !vocabulary.loading
  const status = getCourseVocabularyStatus(ids, learning.lessons[lessonId], learning.items, srs.map, srs.now)
  const byId = new Map(vocabulary.data.map(word => [word.id, word]))

  if (session) return <VocabReviewSession {...session} practiceDirection={session.direction} onExit={() => setSession(null)}
    learning={learning} notebook={notebook} srs={srs} />

  return <div className="paper-wrap py-8 sm:py-12" data-testid="course-vocabulary">
    <Link href={`/learn/${lessonId}`} className="text-sm underline underline-offset-4">返回课程</Link>
    <p className="eyebrow mt-6">本课词汇补练</p>
    <h1 className="mt-2 text-2xl font-semibold leading-relaxed sm:text-3xl">{title}</h1>
    <p className="mt-4 max-w-3xl text-base leading-8 text-muted-foreground">这里的作答目标只包含本课词汇，跨等级的词也会放在一起。选项可能借用其他词作为干扰项。答题后会安排间隔复习；词卡自评和完成课程不能代替测验。</p>
    {!loaded ? <p role="status" className="py-8">正在加载本课词汇…</p> : vocabulary.error ? <div className="py-8" role="alert">
      <p>词汇加载失败，请重试。</p><Button onClick={vocabulary.retry}>重新加载</Button>
    </div> : <>
      <p className="my-6 text-base leading-8" data-testid="course-vocab-counts">共 {ids.length} 词 · 已接触 {status.touched} · 尚未测评 {status.untestedIds.length} · 到期 {status.dueIds.length}</p>
      {ids.length > 0 ? <>
        <div className="flex flex-wrap items-end gap-3 border-y border-border py-5">
          <label className="grid gap-2 text-sm">补练方向<select value={direction} onChange={e => setDirection(e.target.value as VocabReviewDirection)} className="min-h-11 border border-border bg-background px-3 text-base">
            <option value="meaning">日语 → 中文词义</option><option value="recall">中文 → 日语回忆</option><option value="listening">听音 → 中文词义</option>
          </select></label>
          <Button disabled={!status.untestedIds.length} onClick={() => setSession({ ids: status.untestedIds, practice: true, direction })} data-testid="course-vocab-untested">补测未测词（{status.untestedIds.length}）</Button>
          <Button variant="outline" onClick={() => setSession({ ids, practice: true, direction })} data-testid="course-vocab-all">练全部词汇</Button>
          <Button variant="outline" disabled={!status.dueIds.length} onClick={() => setSession({ ids: status.dueIds, practice: false })}>复习本课到期词（{status.dueIds.length}）</Button>
        </div>
        <ul className="divide-y divide-border" data-testid="course-vocab-list">{status.words.map(state => {
          const word = byId.get(state.id)
          return <li key={state.id} className="flex flex-wrap items-center justify-between gap-3 py-5" data-vocab-id={state.id}>
            <div><p lang="ja" className="font-jp text-xl">{word?.kanji ?? word?.kana ?? state.id}{word?.kanji && <span className="ml-2 text-base text-muted-foreground">（{word.kana}）</span>}</p><p className="mt-1 leading-7 text-muted-foreground">{word?.meaning}</p></div>
            <span className="text-sm">{state.tested ? "已有测评" : "尚未测评"}{state.due ? " · 待复习" : ""}</span>
          </li>
        })}</ul>
        <p className="mt-5 text-sm leading-7 text-muted-foreground">“已接触”表示本课已完成或本词已有练习记录；“已有测评”表示至少有一次可识别为实际答题的记录，答错也算已测，不代表掌握。无法区分自评与测验的旧记录仍需补测。</p>
      </> : <p className="py-6 text-base">本课没有新增词汇。可返回课程巩固句型，或前往<Link href="/review" className="underline">复习台</Link>。</p>}
    </>}
  </div>
}
