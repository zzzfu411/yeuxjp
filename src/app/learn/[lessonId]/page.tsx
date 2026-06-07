"use client"

import Link from "next/link"
import { notFound, useParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowLeft, ArrowRight, Sparkles, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { STARTER_LESSONS, getLessonById, isPracticeStep, type LessonStep } from "@/data/lessons"
import { useLearningProgress } from "@/lib/learning-progress"
import { useMistakeNotebook } from "@/lib/mistake-notebook"
import { countPracticeSteps, calculateLessonCompletionScore } from "@/lib/lesson-session"
import { speakJapaneseRepeated } from "@/lib/speech"
import { LessonPracticeFeedback } from "@/components/lesson/lesson-practice-feedback"
import { LessonStepBody } from "@/components/lesson/lesson-step-body"
import { useLessonAnswerRecorder } from "@/components/lesson/use-lesson-answer-recorder"

export default function LessonPage() {
  const params = useParams<{ lessonId: string }>()
  const lesson = getLessonById(params.lessonId)
  const progress = useLearningProgress()
  const mistakes = useMistakeNotebook()
  const [stepIndex, setStepIndex] = useState(0)
  const [answered, setAnswered] = useState<Record<string, boolean>>({})
  const [selected, setSelected] = useState<string | null>(null)
  const [typed, setTyped] = useState("")
  const [built, setBuilt] = useState<string[]>([])
  const [result, setResult] = useState<"correct" | "wrong" | null>(null)

  useEffect(() => {
    if (!lesson) return
    progress.startLesson(lesson.id)
  }, [lesson, progress])

  const current = lesson?.steps[stepIndex]
  const isLast = lesson ? stepIndex === lesson.steps.length - 1 : false
  const practiceSteps = useMemo(() => (lesson ? countPracticeSteps(lesson.steps) : 0), [lesson])
  const correctCount = useMemo(() => Object.values(answered).filter(Boolean).length, [answered])
  const completionScore = calculateLessonCompletionScore(correctCount, practiceSteps)
  const savedLessonProgress = lesson ? progress.lessons[lesson.id] : undefined

  const resetStepState = useCallback(() => {
    setSelected(null)
    setTyped("")
    setBuilt([])
    setResult(null)
  }, [])

  const recordAnswer = useLessonAnswerRecorder({
    lessonId: lesson?.id ?? params.lessonId,
    progress,
    notebook: mistakes,
    setAnswered,
  })

  if (!lesson || !current) return notFound()

  const lessonPosition = STARTER_LESSONS.findIndex((item) => item.id === lesson.id) + 1
  const nextLesson = STARTER_LESSONS[lessonPosition] ?? null
  const stepProgress = ((stepIndex + 1) / lesson.steps.length) * 100

  const playAudio = (text: string) => speakJapaneseRepeated(text, { repeat: 1, gapMs: 200 })

  const goNext = () => {
    if (isLast) {
      progress.completeLesson(lesson.id, completionScore)
      return
    }
    setStepIndex((index) => Math.min(index + 1, lesson.steps.length - 1))
    resetStepState()
  }

  const goBack = () => {
    setStepIndex((index) => Math.max(index - 1, 0))
    resetStepState()
  }

  const submitChoice = (answer: string) => {
    if (current.type !== "multipleChoice" || result) return
    const ok = recordAnswer(current, answer)?.correct ?? false
    setSelected(answer)
    setResult(ok ? "correct" : "wrong")
  }

  const submitTyping = () => {
    if ((current.type !== "typing" && current.type !== "dictation") || result) return
    const ok = recordAnswer(current, typed)?.correct ?? false
    setResult(ok ? "correct" : "wrong")
  }

  const submitSentence = () => {
    if (current.type !== "sentenceBuild" || result) return
    const answer = built.join("")
    const ok = recordAnswer(current, answer)?.correct ?? false
    setResult(ok ? "correct" : "wrong")
  }

  const hasCompletedLesson = progress.lessons[lesson.id]?.status === "completed"

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

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-2xl border bg-card/80 p-5 shadow-sm lg:sticky lg:top-24 lg:self-start">
            <div className="space-y-3">
              <div className="text-xs font-semibold tracking-wider text-muted-foreground">当前课程</div>
              <div>
                <h1 className="text-xl font-bold leading-tight">{lesson.title}</h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{lesson.subtitle}</p>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${stepProgress}%` }} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl border bg-background/70 p-3">
                  <div className="text-xs text-muted-foreground">步骤</div>
                  <div className="font-semibold">{stepIndex + 1}/{lesson.steps.length}</div>
                </div>
                <div className="rounded-xl border bg-background/70 p-3">
                  <div className="text-xs text-muted-foreground">练习正确</div>
                  <div className="font-semibold">{correctCount}/{practiceSteps}</div>
                </div>
              </div>
              {savedLessonProgress?.status === "started" && (
                <div className="rounded-xl border bg-primary/10 p-3 text-sm leading-relaxed">
                  已开始本课。系统会保留本课练习记录；继续完成后会更新课程分数。
                </div>
              )}
              {savedLessonProgress?.status === "completed" && (
                <div className="rounded-xl border bg-green-50 p-3 text-sm leading-relaxed text-green-800 dark:bg-green-900/20 dark:text-green-200">
                  已完成本课，上次分数 {savedLessonProgress.score ?? completionScore}。
                </div>
              )}
            </div>
          </aside>

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
            />

            {result && isPracticeStep(current) ? (
              <LessonPracticeFeedback step={current} result={result} />
            ) : null}

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
                  disabled={isPracticeStep(current) && !result}
                >
                  {isLast ? "完成课程" : "继续"}
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
