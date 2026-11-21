"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { COURSE_PHASES, type CoursePhaseId } from "@/lib/course-phases"
import { useKanjiReadings } from "@/lib/use-kanji-readings"
import { getKanjiReadingStatus, kanjiRecordToken, type KanjiReadingRecord } from "@/lib/kanji-reading-model"
import { kanjiReadingKey, type KanjiReadingQuestion } from "@/lib/kanji-reading-question"
import { speakJapanese } from "@/lib/speech"
import { shuffleList } from "@/lib/question-options"
import { createSeededRandom } from "@/lib/seeded-random"
import { isComposingAnswer } from "@/lib/lesson-presentation"
import { getVocabLevelForId } from "@/data/vocabulary/levels"
import { generateSafeId } from "@/lib/safe-id"

function ReadingAnswer({ question, initialToken, data, review, next }: { question: KanjiReadingQuestion; initialToken: string; data: ReturnType<typeof useKanjiReadings>; review: boolean; next: () => void }) {
  const [answer, setAnswer] = useState("")
  const [token, setToken] = useState(initialToken)
  const [result, setResult] = useState<KanjiReadingRecord | null>(null)
  const submit = async (value: string) => { const saved = await data.save(question, value, token, review); if (saved) setResult(saved) }
  return <section className="space-y-5" data-testid="kanji-question">
    <p className="text-sm text-muted-foreground">按下面的词义输入完整假名读音；含送假名的词也要完整输入。助数词按未接数词时的基本读法。</p>
    <h2 lang="ja" className="font-jp text-4xl font-semibold leading-relaxed" data-testid="kanji-word">{question.word}</h2>
    <p className="text-lg leading-8">{question.meaning}</p>
    {!result ? <form onSubmit={event => { event.preventDefault(); if (answer.trim()) void submit(answer.trim()) }} className="space-y-4">
      <label className="block space-y-2"><span className="text-sm">假名读音</span><input autoComplete="off" spellCheck={false} aria-label="假名读音" value={answer} onChange={event => setAnswer(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && isComposingAnswer(event.nativeEvent)) event.preventDefault() }} disabled={data.pending} className="block w-full rounded-md border-2 border-foreground/70 bg-background p-3 font-jp text-xl" /></label>
      <div className="flex flex-wrap gap-3"><Button disabled={data.pending || !answer.trim()}>检查读音</Button><Button type="button" variant="outline" disabled={data.pending} onClick={() => void submit("")}>不会，查看答案</Button></div>
      {data.saveError && <div role="alert" className="space-y-3 text-sm leading-7"><p>这次没有保存。记录可能已在另一页面改变，或存储暂时不可用。输入已保留。</p><Button type="button" variant="outline" onClick={() => setToken(kanjiRecordToken(data.store[kanjiReadingKey(question)]))}>重新载入本词记录后重试</Button></div>}
    </form> : <div className="space-y-4 border-t border-border pt-5" data-testid="kanji-feedback">
      <p className="text-lg font-semibold" role="status">{result.lastCorrect ? "本次读音答对" : "本次未匹配，需要再练"}</p>
      <p className="text-base leading-8">本题读音：<span lang="ja" className="font-jp">{[question.reading, ...question.acceptedReadings].join(" / ")}</span></p>
      <p className="text-sm leading-7 text-muted-foreground">读法随词义、语境和语体变化，以上为本题收录的常见读法。本次{result.lastCorrect ? "已安排稍后复习" : "保留在需练与到期列表"}；一次答对不代表所有汉字或读法都已掌握。</p>
      <div className="flex flex-wrap gap-3"><Button onClick={next}>下一词</Button><Button variant="outline" onClick={() => speakJapanese(question.reading)}>听词条读音</Button><Button asChild variant="ghost"><Link href={(() => { const level = getVocabLevelForId(question.id); return level ? `/vocabulary?level=${level}&item=${encodeURIComponent(question.id)}` : `/vocabulary?item=${encodeURIComponent(question.id)}` })()}>查看词条与例句</Link></Button></div>
    </div>}
  </section>
}

export function StageKanjiPage({ phase, questions }: { phase: CoursePhaseId; questions: KanjiReadingQuestion[] }) {
  const info = COURSE_PHASES.find(item => item.id === phase)!
  const data = useKanjiReadings()
  const [round, setRound] = useState<{ id: string; questions: KanjiReadingQuestion[]; tokens: Record<string, string>; review: boolean; index: number } | null>(null)
  const [clock, setClock] = useState(0)
  const summary = getKanjiReadingStatus(questions, data.store, clock)
  const start = (mode: "unmeasured" | "practice" | "due" | "all", now: number, id: string) => {
    const latest = getKanjiReadingStatus(questions, data.store, now)
    const pool = mode === "all" ? questions : latest[mode].map(row => row.question)
    const selected = shuffleList(pool, createSeededRandom(id)).slice(0, 10)
    setClock(now)
    setRound({ id, questions: selected, tokens: Object.fromEntries(selected.map(q => [q.id, kanjiRecordToken(data.store[kanjiReadingKey(q)])])), review: mode === "due", index: 0 })
  }
  // Wall-clock due status updates on focus and every minute without changing an active round.
  const ready = data.loaded && !data.error
  return <div className="paper-wrap max-w-3xl py-8 sm:py-12" data-testid="stage-kanji">
    <KanjiClock onTime={setClock} />
    <Link href="/placement#kanji" className="text-sm underline underline-offset-4">返回阶段与汉字集合</Link>
    <p className="eyebrow mt-6">{info.label} · 词中的汉字</p><h1 className="mt-3 text-3xl font-semibold leading-relaxed">把这个词读出来</h1>
    <p className="mt-4 text-base leading-8 text-muted-foreground">本阶段课程声明的 {questions.length} 个汉字词条。每轮最多 10 词，输入读音后即时保存并安排复习。各阶段共有的同一词条共用读音记录；词义自评、手写与口头发音分别看待。</p>
    {!data.loaded ? <p className="mt-6" role="status">正在读取读音记录…</p> : data.error ? <p role="alert" className="mt-6 text-destructive">读音记录无法读取，已暂停保存并保留原数据。请到<Link className="underline" href="/settings">设置备份与恢复</Link>。</p> : <>
      <p className="my-6 border-y border-border py-4 text-sm leading-8" data-testid="kanji-status">当前版本：未测 {summary.unmeasured.length} · 需练 {summary.practice.length} · 最近答对 {summary.correct.length} · 到期 {summary.due.length}</p>
      {!round ? <div className="flex flex-wrap gap-3">{([["unmeasured", "练未测词"], ["practice", "练错读词"], ["due", "复习到期词"], ["all", "从全部抽取"]] as const).map(([mode, label]) => <Button key={mode} variant={mode === "unmeasured" ? "default" : "outline"} disabled={!ready || (mode !== "all" && !summary[mode].length)} onClick={() => start(mode, Date.now(), generateSafeId())}>{label}</Button>)}</div> : round.index >= round.questions.length ? <section data-testid="kanji-round-end" className="space-y-4"><h2 className="text-xl font-semibold">这一轮结束了</h2><p className="text-base leading-8">完成 {round.questions.length} 词，作答与复习安排已保存。读错的词仍在需练列表。</p><Button onClick={() => setRound(null)}>返回集合</Button></section> : <div className="space-y-5"><div className="flex items-center justify-between gap-3"><p className="font-semibold">第 {round.index + 1}/{round.questions.length} 词</p><Button variant="ghost" disabled={data.pending} onClick={() => setRound(null)}>结束本轮</Button></div><ReadingAnswer key={`${round.id}:${round.index}`} question={round.questions[round.index]} initialToken={round.tokens[round.questions[round.index].id]} data={data} review={round.review} next={() => { setClock(Date.now()); setRound({ ...round, index: round.index + 1 }) }} /></div>}
      {!round && <details className="mt-8 border-t border-border pt-5"><summary className="cursor-pointer text-lg font-semibold">查看完整词条清单（{questions.length}）</summary><ul className="mt-5 divide-y divide-border/50">{summary.rows.map(row => <li key={row.question.id} className="flex flex-wrap justify-between gap-2 py-3 text-base leading-7"><span lang="ja">{row.question.word}</span><span className="text-sm text-muted-foreground">{row.status === "unmeasured" ? "未测读音" : row.status === "practice" ? "需练" : "最近答对"}{row.due ? " · 已到期" : ""}</span></li>)}</ul></details>}
    </>}
  </div>
}

function KanjiClock({ onTime }: { onTime: (now: number) => void }) {
  useEffect(() => { const update = () => onTime(Date.now()); queueMicrotask(update); const timer = setInterval(update, 60_000); window.addEventListener("focus", update); return () => { clearInterval(timer); window.removeEventListener("focus", update) } }, [onTime])
  return null
}
