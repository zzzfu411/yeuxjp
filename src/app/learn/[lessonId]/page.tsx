"use client"

import Link from "next/link"
import { notFound, useParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState, type SetStateAction } from "react"
import { ArrowLeft, ArrowRight, Sparkles, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { STARTER_LESSONS, getLessonById, getNextLesson, isPracticeStep, type LessonStep } from "@/data/lessons"
import { useLearningProgress } from "@/lib/learning-progress"
import { useMistakeNotebook } from "@/lib/mistake-notebook"
import { isLessonUnlocked } from "@/lib/learning-entry"
import {
  countPracticeSteps,
  calculateLessonCompletionScore,
  getLessonAnsweredFromResults,
  resolveLessonResumeStepIndex,
} from "@/lib/lesson-session"
import { speakJapaneseRepeated } from "@/lib/speech"
import { LessonPracticeFeedback } from "@/components/lesson/lesson-practice-feedback"
import { LessonStepBody } from "@/components/lesson/lesson-step-body"
import { LessonProgressSidebar } from "@/components/lesson/lesson-progress-sidebar"
import { useLessonAnswerRecorder } from "@/components/lesson/use-lesson-answer-recorder"
import { PracticeSaveError } from "@/components/practice/practice-save-error"

export default function LessonPage() {
  const params = useParams<{ lessonId: string }>()
  const lesson = getLessonById(params.lessonId)
  const progress = useLearningProgress()
  const mistakes = useMistakeNotebook()
  const { lessons, results, loaded, startLesson, completeLesson, saveLessonPosition } = progress
  const [manualStep, setManualStep] = useState<{ lessonId: string; index: number } | null>(null)
  const [answeredDraft, setAnsweredDraft] = useState<{ lessonId: string; answers: Record<string, boolean> } | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [typed, setTyped] = useState("")
  const [built, setBuilt] = useState<string[]>([])
  const [result, setResult] = useState<"correct" | "wrong" | null>(null)
  const [saveError, setSaveError] = useState(false)
  const savedLessonProgress = lesson ? lessons[lesson.id] : undefined
  const lessonUnlocked = useMemo(() => {
    if (!lesson || !loaded) return true
    return isLessonUnlocked(lesson, progress.completedLessonIds)
  }, [lesson, loaded, progress.completedLessonIds])
  const recommendedLesson = useMemo(() => getNextLesson(progress.completedLessonIds), [progress.completedLessonIds])
  const lessonReadOnly = !loaded || !lessonUnlocked

  const resetStepState = useCallback(() => {
    setSelected(null)
    setTyped("")
    setBuilt([])
    setResult(null)
    setSaveError(false)
  }, [])

  useEffect(() => {
    if (!lesson || !loaded) return
    if (!lessonUnlocked) return
    const saved = startLesson(lesson.id)
    const timer = window.setTimeout(() => setSaveError(!saved), 0)
    return () => window.clearTimeout(timer)
  }, [lesson, lessonUnlocked, loaded, startLesson])

  const resumedStepIndex = useMemo(() => {
    if (!lesson || !loaded) return 0
    return resolveLessonResumeStepIndex(savedLessonProgress, lesson.steps)
  }, [lesson, loaded, savedLessonProgress])

  const stepIndex = lesson && manualStep?.lessonId === lesson.id ? manualStep.index : resumedStepIndex

  useEffect(() => {
    if (!lesson || !loaded) return
    if (!lessonUnlocked) return
    const step = lesson.steps[stepIndex]
    const saved = saveLessonPosition(lesson.id, stepIndex, step?.id)
    const timer = window.setTimeout(() => setSaveError(!saved), 0)
    return () => window.clearTimeout(timer)
  }, [lesson, lessonUnlocked, loaded, stepIndex, saveLessonPosition])

  const current = lesson?.steps[stepIndex]
  const isLast = lesson ? stepIndex === lesson.steps.length - 1 : false
  const practiceSteps = useMemo(() => (lesson ? countPracticeSteps(lesson.steps) : 0), [lesson])
  const restoredAnswered = useMemo(() => {
    return lesson ? getLessonAnsweredFromResults(lesson.id, lesson.steps, results) : {}
  }, [lesson, results])

  const answered = useMemo(() => {
    if (!lesson) return restoredAnswered
    if (answeredDraft?.lessonId !== lesson.id) return restoredAnswered
    return { ...restoredAnswered, ...answeredDraft.answers }
  }, [answeredDraft, lesson, restoredAnswered])

  const setAnsweredForLesson = useCallback(
    (update: SetStateAction<Record<string, boolean>>) => {
      if (!lesson) return
      setAnsweredDraft((prev) => {
        const base = {
          ...restoredAnswered,
          ...(prev?.lessonId === lesson.id ? prev.answers : {}),
        }
        const answers = typeof update === "function" ? update(base) : update
        return { lessonId: lesson.id, answers }
      })
    },
    [lesson, restoredAnswered]
  )

  const correctCount = useMemo(() => Object.values(answered).filter(Boolean).length, [answered])
  const completionScore = calculateLessonCompletionScore(correctCount, practiceSteps)

  const recordAnswer = useLessonAnswerRecorder({
    lessonId: lesson?.id ?? params.lessonId,
    progress,
    notebook: mistakes,
    setAnswered: setAnsweredForLesson,
  })

  if (!lesson || !current) return notFound()

  const lessonPosition = STARTER_LESSONS.findIndex((item) => item.id === lesson.id) + 1
  const nextLesson = STARTER_LESSONS[lessonPosition] ?? null
  const stepProgress = ((stepIndex + 1) / lesson.steps.length) * 100

  const playAudio = (text: string) => speakJapaneseRepeated(text, { repeat: 1, gapMs: 200 })

  const goNext = () => {
    if (!loaded) return
    if (!lessonUnlocked && isLast) return
    if (isLast) {
      setSaveError(!completeLesson(lesson.id, completionScore))
      return
    }
    setManualStep({ lessonId: lesson.id, index: Math.min(stepIndex + 1, lesson.steps.length - 1) })
    resetStepState()
  }

  const goBack = () => {
    setManualStep({ lessonId: lesson.id, index: Math.max(stepIndex - 1, 0) })
    resetStepState()
  }

  const submitChoice = (answer: string) => {
    if (lessonReadOnly) return
    if (current.type !== "multipleChoice" || result) return
    const recorded = recordAnswer(current, answer)
    if (!recorded) {
      setSaveError(true)
      return
    }
    const ok = recorded.correct
    setSaveError(false)
    setSelected(answer)
    setResult(ok ? "correct" : "wrong")
  }

  const submitTyping = () => {
    if (lessonReadOnly) return
    if ((current.type !== "typing" && current.type !== "dictation") || result) return
    const recorded = recordAnswer(current, typed)
    if (!recorded) {
      setSaveError(true)
      return
    }
    const ok = recorded.correct
    setSaveError(false)
    setResult(ok ? "correct" : "wrong")
  }

  const submitSentence = () => {
    if (lessonReadOnly) return
    if (current.type !== "sentenceBuild" || result) return
    const answer = built.join("")
    const recorded = recordAnswer(current, answer)
    if (!recorded) {
      setSaveError(true)
      return
    }
    const ok = recorded.correct
    setSaveError(false)
    setResult(ok ? "correct" : "wrong")
  }

  const hasCompletedLesson = lessons[lesson.id]?.status === "completed"

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.18),transparent_32rem),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.22))]">
      <div className="container mx-auto max-w-5xl px-4 py-8 md:py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              返回今日学习
            </Link>
          </Button>
          <div className="text-xs font-semibold text-muted-foreground">
            Starter 14 · Day {lessonPosition}/14 · {lesson.estimatedMinutes} 分钟
          </div>
        </div>

        {loaded && !lessonUnlocked ? (
          <div className="mb-6 rounded-2xl border bg-muted/40 p-4 text-sm">
            <div className="font-semibold">这节课还没有解锁</div>
            <p className="mt-1 leading-relaxed text-muted-foreground">
              你可以先预览内容，但当前课程不会自动写入学习进度。建议先完成前置课程，再回来练习。
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {recommendedLesson ? (
                <Button asChild size="sm" className="rounded-full">
                  <Link href={`/learn/${recommendedLesson.id}`}>去推荐课程</Link>
                </Button>
              ) : null}
              <Button asChild size="sm" variant="outline" className="rounded-full">
                <Link href="/path">查看技能树</Link>
              </Button>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <LessonProgressSidebar
            lesson={lesson}
            lessonPosition={lessonPosition}
            stepIndex={stepIndex}
            stepProgress={stepProgress}
            correctCount={correctCount}
            practiceSteps={practiceSteps}
            completionScore={completionScore}
            savedProgress={savedLessonProgress}
          />

          <main className="rounded-3xl border bg-card p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs font-semibold text-muted-foreground">
                  {stepLabel(current.type)}
                </div>
                <h2 className="text-2xl font-bold tracking-tight">{current.title}</h2>
              </div>
              {"audioText" in current && current.audioText ? (
                <Button type="button" variant="outline" size="icon" className="shrink-0 rounded-full" onClick={() => playAudio(current.audioText!)}>
                  <Volume2 className="h-4 w-4" />
                </Button>
              ) : null}
            </div>

            <LessonStepBody
              step={current}
              selected={selected}
              typed={typed}
              built={built}
              result={result}
              onSelect={submitChoice}
              onTyped={setTyped}
              onSubmitTyping={submitTyping}
              onPickChunk={(chunk) => {
                if (result) return
                setBuilt((prev) => [...prev, chunk])
              }}
              onUndoChunk={() => setBuilt((prev) => prev.slice(0, -1))}
              onResetChunks={() => setBuilt([])}
              onSubmitSentence={submitSentence}
              onPlay={playAudio}
              readOnly={lessonReadOnly}
            />

            {result && isPracticeStep(current) ? (
              <LessonPracticeFeedback step={current} result={result} />
            ) : null}

            <PracticeSaveError show={saveError} />

            {current.type === "summary" && hasCompletedLesson ? (
              <div className="mt-5 rounded-2xl border bg-primary/10 p-5">
                <div className="flex items-center gap-2 font-semibold">
                  <Sparkles className="h-4 w-4" />
                  课程已完成，掌握度已写入今日学习记录。
                </div>
              </div>
            ) : null}

            <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t pt-5">
              <Button type="button" variant="outline" className="gap-2 rounded-full" onClick={goBack} disabled={stepIndex === 0}>
                <ArrowLeft className="h-4 w-4" />
                上一步
              </Button>

              {current.type === "summary" && hasCompletedLesson ? (
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" className="rounded-full">
                    <Link href="/review">去复习</Link>
                  </Button>
                  <Button asChild className="gap-2 rounded-full">
                    <Link href={nextLesson ? `/learn/${nextLesson.id}` : "/"}>
                      {nextLesson ? "下一课" : "回到首页"}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  className="gap-2 rounded-full"
                  data-testid="lesson-next"
                  onClick={goNext}
                  disabled={!loaded || (!lessonUnlocked && isLast) || (lessonUnlocked && isPracticeStep(current) && !result)}
                >
                  {!lessonUnlocked ? (isLast ? "预览结束" : "继续预览") : isLast ? "完成课程" : "继续"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

function stepLabel(type: LessonStep["type"]) {
  const labels: Record<LessonStep["type"], string> = {
    explain: "微课讲解",
    example: "例句",
    multipleChoice: "识别练习",
    typing: "主动回忆",
    dictation: "听写",
    sentenceBuild: "组句输出",
    summary: "小结",
  }
  return labels[type]
}
