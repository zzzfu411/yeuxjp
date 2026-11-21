"use client"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { COURSE_PHASES, type CoursePhaseId } from "@/lib/course-phases"
import { DIAGNOSTIC_DOMAIN_LABELS, type DiagnosticQuestion } from "@/data/stage-diagnostics"
import { diagnosticAudioId, diagnosticDefinitionIsCurrent, diagnosticOptions, summarizeDiagnostic, type DiagnosticAttempt, type DiagnosticAction } from "@/lib/stage-diagnostic-model"
import { useStageDiagnostics } from "@/lib/use-stage-diagnostics"
import { cancelJapaneseSpeech, ensureJapaneseVoicesReady, isSpeechSupported, speakJapanese } from "@/lib/speech"
import { isComposingAnswer } from "@/lib/lesson-presentation"
import { generateSafeId } from "@/lib/safe-id"

const PRACTICE_LINKS = { words: "/vocabulary", grammar: "/grammar", reading: "/path", listening: "/quiz?mode=audio-kana" }

function DiagnosticQuestionForm({ attempt, question, pending, dispatch }: { attempt: DiagnosticAttempt; question: DiagnosticQuestion; pending: boolean; dispatch: (action: DiagnosticAction) => Promise<boolean> }) {
  const [answer, setAnswer] = useState("")
  const [playing, setPlaying] = useState(false)
  const [audioError, setAudioError] = useState("")
  const playback = useRef<SpeechSynthesisUtterance | null>(null)
  const live = useRef(true)
  const questionHeading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    questionHeading.current?.focus({ preventScroll: true })
    questionHeading.current?.scrollIntoView({ block: "start", behavior: "instant" })
  }, [question.id])
  useEffect(() => {
    live.current = true
    return () => { live.current = false; if (playback.current) cancelJapaneseSpeech(playback.current) }
  }, [])
  const clip = diagnosticAudioId(question)
  const transcriptShown = !!clip && attempt.assistedAudio.includes(clip)
  const heard = !!clip && attempt.heardAudio.includes(clip)
  const play = async () => {
    if (!question.audio) return
    if (!isSpeechSupported() || !(await ensureJapaneseVoicesReady(1500))) {
      if (live.current) {
        setAudioError("当前未找到日语朗读声音。可在系统中启用日语语音后重试；也可查看文本或跳过，这两种情况不计独立听力答对。")
      }
      return
    }
    if (!live.current) return
    setAudioError(""); setPlaying(true)
    let started = false
    try {
      playback.current = speakJapanese(question.audio, {
        onStart: () => { started = true },
        onEnd: () => { if (live.current) { setPlaying(false); if (started) void dispatch({ type: "heard", id: attempt.id, questionId: question.id }) } },
        onCancel: () => { if (live.current) setPlaying(false) },
        onError: () => { if (live.current) { setPlaying(false); setAudioError("播放未完成，本次未计入听力。请重试或跳过。") } },
      })
      if (!playback.current) { setPlaying(false); setAudioError("无法播放日语，请重试或跳过。") }
    } catch { setPlaying(false); setAudioError("播放失败，本次未计入听力。请重试或跳过。") }
  }
  return <form className="mt-7 space-y-5" onSubmit={event => { event.preventDefault(); if (answer.trim()) void dispatch({ type: "answer", id: attempt.id, questionId: question.id, value: answer.trim() }) }} data-testid="diagnostic-question">
    <h2 ref={questionHeading} tabIndex={-1} className="scroll-mt-28 text-xl font-semibold leading-9" data-testid="diagnostic-question-heading">{question.prompt}</h2>
    {question.passage && <p lang="ja" className="whitespace-pre-wrap border-y border-border py-5 font-jp text-lg leading-9" data-testid="diagnostic-passage">{question.passage}</p>}
    {question.audio && <div className="space-y-3 border-y border-border py-5" data-testid="diagnostic-audio">
      <div className="flex flex-wrap gap-3"><Button type="button" onClick={play} disabled={pending || playing}>{playing ? "正在播放…" : "播放材料"}</Button>{playing && <Button type="button" variant="outline" onClick={() => { if (playback.current) cancelJapaneseSpeech(playback.current) }}>停止播放</Button>}</div>
      <p className="text-sm leading-7" role="status">{transcriptShown ? "已查看这段材料的文字；同段两题均按辅助作答记录。" : heard ? "本段已完整播放，可以重听。" : "先完整听一遍材料；同一段材料对应两道题。"}</p>
      {audioError && <p role="alert" className="text-sm leading-7 text-destructive">{audioError}</p>}
      {transcriptShown ? <p lang="ja" className="whitespace-pre-wrap font-jp text-lg leading-9" data-testid="diagnostic-transcript">{question.audio}</p> : <Button type="button" variant="ghost" disabled={pending || playing} onClick={() => void dispatch({ type: "transcript", id: attempt.id, questionId: question.id })}>看文字辅助（本段不计独立听力）</Button>}
    </div>}
    <fieldset disabled={pending || playing} className="space-y-4">
      <legend className="sr-only">{question.prompt}</legend>
      {question.readingInput ? <label className="block space-y-2"><span className="text-sm">完整假名读音</span><input autoComplete="off" spellCheck={false} value={answer} onChange={event => setAnswer(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && isComposingAnswer(event.nativeEvent)) event.preventDefault() }} aria-label="完整假名读音" className="block w-full rounded-md border-2 border-foreground/70 bg-background p-3 font-jp text-xl" /></label> : <div className="space-y-3">{diagnosticOptions(question, attempt.id).map(option => <label key={option} className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-4 text-base leading-7"><input type="radio" name="diagnostic-answer" value={option} checked={answer === option} onChange={() => setAnswer(option)} className="mt-1.5 shrink-0" /><span>{option}</span></label>)}</div>}
      <div className="flex flex-wrap gap-3 pt-2"><Button type="submit" disabled={!answer.trim()}>确认并继续</Button><Button type="button" variant="outline" onClick={() => void dispatch({ type: "answer", id: attempt.id, questionId: question.id, value: "" })}>不会，跳过此题</Button></div>
    </fieldset>
  </form>
}

function DiagnosticResult({ attempt, active, pending, dispatch }: { attempt: DiagnosticAttempt; active: boolean; pending: boolean; dispatch: (action: DiagnosticAction) => Promise<boolean> }) {
  const result = summarizeDiagnostic(attempt)
  const resultHeading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    resultHeading.current?.focus({ preventScroll: true })
    resultHeading.current?.scrollIntoView({ block: "start", behavior: "instant" })
  }, [attempt.id])
  return <section className="mt-6 space-y-5" data-testid="diagnostic-result">
    <h2 ref={resultHeading} tabIndex={-1} className="scroll-mt-28 text-2xl font-semibold" data-testid="diagnostic-result-heading">{!result.current ? "历史版本记录" : result.passed ? "本套诊断达到定位条件" : "建议先补练，再检查"}</h2>
    <p className="text-base leading-8">独立答对 {result.correct}/{attempt.questions.length}（{result.score}%），汉字读音 {result.kanjiCorrect}/{result.kanjiTotal}。{result.complete ? "" : "本轮未完成。"}{!result.current && "材料或规则已更新，本轮仅保留历史，不用于当前定位。"}</p>
    <div className="grid gap-3 sm:grid-cols-2">{result.domains.map(domain => <div key={domain.domain} className="rounded-md border border-border p-4"><p className="font-semibold">{DIAGNOSTIC_DOMAIN_LABELS[domain.domain]} · {domain.correct}/{domain.total}</p><p className="mt-1 text-sm leading-7">{domain.passed ? "本套分项达到条件" : "本套分项需补练"} · <Link className="underline underline-offset-4" href={domain.domain === "words" ? `/checkpoints/${attempt.phase}/kanji` : PRACTICE_LINKS[domain.domain]}>进入补练</Link></p></div>)}</div>
    {result.entryOrder && <div className="border-y border-border py-5"><p className="mb-3 text-base leading-8">建议从第 {result.entryOrder} 课进入下一阶段。下级课程仍可查阅，跳过与已完成分别统计。</p><Button disabled={pending || active} onClick={() => void dispatch({ type: "adopt", id: attempt.id })}>{active ? "已采用本轮定位" : `采用第 ${result.entryOrder} 课为起点`}</Button></div>}
    {result.passed && attempt.phase === "n2" && <p className="text-base leading-8">已达到本项目 N2 分区这套检查的条件。可继续阶段作品和薄弱项复习；本站没有 N1 主线，此结果不代表通过 JLPT N2。</p>}
    <details className="border-y border-border py-4"><summary className="cursor-pointer text-lg font-semibold">查看逐题答案与解析</summary><ol className="mt-5 space-y-6">{result.rows.map((row, index) => <li key={row.question.id} className="border-b border-border/50 pb-5"><h3 className="text-base font-semibold leading-8">{index + 1}. {row.question.prompt}</h3><p className="text-sm leading-7">{row.answer ? `你的答案：${row.answer.value || "跳过"}` : "尚未回答"} · {row.independent ? row.correct ? "独立答对" : "未答对" : "辅助或未完成听力"}</p>{(row.question.audio || row.question.passage) && <p lang="ja" className="my-3 whitespace-pre-wrap font-jp text-base leading-8">{row.question.audio || row.question.passage}</p>}<p className="text-base leading-8">答案：{row.question.answer}</p><p className="text-sm leading-7 text-muted-foreground">{row.question.explanation}</p></li>)}</ol></details>
  </section>
}

export function StageDiagnosticPage({ phase }: { phase: CoursePhaseId }) {
  const data = useStageDiagnostics()
  const saveFailure = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    if (!data.saveError || data.pending) return
    saveFailure.current?.focus({ preventScroll: true })
    saveFailure.current?.scrollIntoView({ block: "start", behavior: "instant" })
  }, [data.saveError, data.pending])
  const info = COURSE_PHASES.find(item => item.id === phase)!
  const [selected, setSelected] = useState<string | null>(null)
  const attempts = Object.values(data.store.attempts).filter(item => item.phase === phase).sort((a, b) => b.createdAt - a.createdAt)
  const attempt = attempts.find(item => item.id === selected) ?? attempts[0]
  const question = attempt?.questions.find(item => !attempt.answers[item.id])
  const current = attempt && diagnosticDefinitionIsCurrent(attempt)
  const inProgress = !!attempt && attempt.completedAt === undefined && current
  const start = async () => { const id = generateSafeId(); if (await data.dispatch({ type: "start", phase, id })) setSelected(id) }
  return <div className="paper-wrap max-w-3xl py-8 sm:py-12" data-testid="stage-diagnostic">
    <Link href="/placement" className="text-sm underline underline-offset-4">返回起点与阶段说明</Link>
    <p className="eyebrow mt-6">{info.label} · 项目内诊断</p><h1 className="mt-3 text-3xl font-semibold leading-relaxed">检查你的下一步</h1>
    <p className="mt-4 text-base leading-8 text-muted-foreground">16 题，词汇、语法、阅读、听力各 4 题。作答自动保存，可以中途离开，整套结束后查看解析。</p>
    <details className="mt-3 border-y border-border/50 py-3 text-sm leading-7 text-muted-foreground"><summary className="cursor-pointer font-semibold text-foreground">定位条件与听力说明</summary><p className="mt-3">独立答对至少 13 题、每项至少 2 题，且两道汉字读音至少答对 1 题，才达到定位条件。使用词典或外部帮助时，请在下方如实记录。</p><p className="mt-3">听力使用设备日语朗读，可重听，语速沿用听力设置。这是小样本学习定位，不是 JLPT 模拟分数，也不测口语、手写或标准考试速度。重复检查仍使用这套材料，不能视作未见题成绩。</p></details>
    {!data.loaded ? <p className="mt-6" role="status">正在读取诊断记录…</p> : data.error ? <p role="alert" className="mt-6 text-destructive">诊断记录无法读取，已暂停保存。原数据保留，请前往<Link href="/settings" className="underline">设置备份与恢复</Link>。</p> : <>
      {data.saveError && <p ref={saveFailure} tabIndex={-1} role="alert" data-testid="diagnostic-save-error" className="mt-5 scroll-mt-28 text-destructive">保存失败或记录已在另一页面改变。当前输入仍在，请检查记录后重试；本次未计入。</p>}
      {!attempt && <Button className="mt-6" disabled={data.pending} onClick={() => void start()}>开始本阶段诊断</Button>}
      {attempt && <>
        <p className="mt-6 text-sm text-muted-foreground">本轮开始于 {new Date(attempt.createdAt).toLocaleString("zh-CN")} · 已保存 {Object.keys(attempt.answers).length}/{attempt.questions.length} 题</p>
        {inProgress && question ? <>
          <p className="mt-3 font-semibold" role="status">第 {Object.keys(attempt.answers).length + 1}/{attempt.questions.length} 题 · {DIAGNOSTIC_DOMAIN_LABELS[question.domain]}</p>
          <label className="mt-3 flex items-start gap-3 text-sm leading-7"><input type="checkbox" className="mt-1.5" checked={attempt.usedReferences} disabled={data.pending || attempt.usedReferences} onChange={() => void data.dispatch({ type: "references", id: attempt.id })} /><span>本轮使用了词典、他人帮助或外部参考（如实记录，本轮转为辅助练习）</span></label>
          <DiagnosticQuestionForm key={`${attempt.id}:${question.id}`} attempt={attempt} question={question} dispatch={data.dispatch} pending={data.pending} />
        </> : <DiagnosticResult attempt={attempt} active={data.store.entryAttemptId === attempt.id} pending={data.pending} dispatch={data.dispatch} />}
      </>}
      {attempt && !inProgress && <Button className="mt-6" variant="outline" disabled={data.pending} onClick={() => void start()}>开始新一轮（已见材料）</Button>}
      {attempts.length > 1 && <details className="mt-8 border-t border-border pt-4"><summary className="cursor-pointer font-semibold">历史轮次（{attempts.length}）</summary><ul className="mt-3 space-y-3">{attempts.map(item => <li key={item.id}><button className="text-left text-sm leading-7 underline underline-offset-4" disabled={data.pending} onClick={() => setSelected(item.id)}>{new Date(item.createdAt).toLocaleString("zh-CN")} · {item.completedAt !== undefined ? "已结束" : "未完成"} · {diagnosticDefinitionIsCurrent(item) ? "当前材料" : "历史材料"}</button></li>)}</ul></details>}
    </>}
  </div>
}
