"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState, type SetStateAction } from "react"
import { ArrowLeft, Sparkles, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { STARTER_LESSONS, getNextLesson, isPracticeStep, type Lesson, type LessonStep } from "@/data/lessons"
import { useLearningProgress } from "@/lib/learning-progress"
import { useMistakeNotebook } from "@/lib/mistake-notebook"
import { isLessonUnlocked } from "@/lib/learning-entry"
import {
  buildLessonRunnerViewModel,
  countPracticeSteps,
  getLessonAnsweredFromResults,
  resolveLessonResumeStepIndex,
} from "@/lib/lesson-session"
import { speakJapaneseRepeated } from "@/lib/speech"
import { LessonPracticeFeedback } from "@/components/lesson/lesson-practice-feedback"
import { LessonStepBody } from "@/components/lesson/lesson-step-body"
import { LessonProgressSidebar } from "@/components/lesson/lesson-progress-sidebar"
import { LessonLockedPreview } from "@/components/lesson/lesson-locked-preview"
import { LessonNavigationBar } from "@/components/lesson/lesson-navigation-bar"
import { useLessonAnswerRecorder } from "@/components/lesson/use-lesson-answer-recorder"
import { useLessonStepPractice } from "@/components/lesson/use-lesson-step-practice"
import { PracticeSaveError } from "@/components/practice/practice-save-error"

interface LessonRunnerProps {
  lesson: Lesson
}

export function LessonRunner({ lesson }: LessonRunnerProps) {
  const progress = useLearningProgress()
  const mistakes = useMistakeNotebook()
  const { lessons, results, loaded, startLesson, completeLesson, saveLessonPosition } = progress
  const [manualStep, setManualStep] = useState<{ lessonId: string; index: number } | null>(null)
  const [answeredDraft, setAnsweredDraft] = useState<{ lessonId: string; answers: Record<string, boolean> } | null>(null)
  const [saveError, setSaveError] = useState(false)
  const savedLessonProgress = lesson ? lessons[lesson.id] : undefined
  const lessonUnlocked = useMemo(() => {
    if (!lesson || !loaded) return true
    return isLessonUnlocked(lesson, progress.completedLessonIds)
  }, [lesson, loaded, progress.completedLessonIds])
  const recommendedLesson = useMemo(() => getNextLesson(progress.completedLessonIds), [progress.completedLessonIds])

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

  const current = lesson.steps[stepIndex]
  const isLast = stepIndex === lesson.steps.length - 1
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

  const lessonView = useMemo(() => {
    return buildLessonRunnerViewModel({
      lesson,
      courseLessons: STARTER_LESSONS,
      lessons,
      stepIndex,
      answered,
      practiceSteps,
      loaded,
      lessonUnlocked,
    })
  }, [answered, lesson, lessons, loaded, lessonUnlocked, practiceSteps, stepIndex])
  const {
    lessonPosition,
    nextLesson,
    stepProgress,
    correctCount,
    completionScore,
    lessonReadOnly,
    hasCompletedLesson,
  } = lessonView

  const recordAnswer = useLessonAnswerRecorder({
    lessonId: lesson.id,
    progress,
    notebook: mistakes,
    setAnswered: setAnsweredForLesson,
  })
  const {
    selected,
    typed,
    setTyped,
    built,
    result,
    resetStepState,
    submitChoice,
    submitTyping,
    pickChunk,
    undoChunk,
    resetChunks,
    submitSentence,
  } = useLessonStepPractice({
    current,
    readOnly: lessonReadOnly,
    recordAnswer,
    setSaveError,
  })

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

        {loaded && !lessonUnlocked ? <LessonLockedPreview recommendedLesson={recommendedLesson} /> : null}

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
              onPickChunk={pickChunk}
              onUndoChunk={undoChunk}
              onResetChunks={resetChunks}
              onSubmitSentence={submitSentence}
              onPlay={playAudio}
              readOnly={lessonReadOnly}
            />

            {result && isPracticeStep(current) ? (
              <LessonPracticeFeedback step={current} result={result} />
            ) : null}

            <PracticeSaveError show={saveError} />

            {current.type === "summary" && hasCompletedLesson ? (
              <div className="mt-5 rounded-2xl border bg-primary/10 p-5" data-testid="lesson-completed-summary">
                <div className="flex items-center gap-2 font-semibold">
                  <Sparkles className="h-4 w-4" />
                  课程已完成，掌握度已写入今日学习记录。
                </div>
              </div>
            ) : null}

            <LessonNavigationBar
              current={current}
              hasCompletedLesson={hasCompletedLesson}
              isLast={isLast}
              lessonUnlocked={lessonUnlocked}
              loaded={loaded}
              nextLesson={nextLesson}
              onBack={goBack}
              onNext={goNext}
              result={result}
              stepIndex={stepIndex}
            />
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
