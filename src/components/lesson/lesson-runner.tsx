"use client"

import { useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { isPracticeStep, STARTER_LESSONS, type Lesson, type LessonStep } from "@/data/lessons"
import { cancelJapaneseSpeech, speakJapaneseRepeated } from "@/lib/speech"
import { LessonCompletionRecap } from "@/components/lesson/lesson-completion-recap"
import { LessonPracticeFeedback } from "@/components/lesson/lesson-practice-feedback"
import { LessonStepBody } from "@/components/lesson/lesson-step-body"
import { LessonProgressSidebar } from "@/components/lesson/lesson-progress-sidebar"
import { LessonLockedPreview } from "@/components/lesson/lesson-locked-preview"
import { LessonNavigationBar } from "@/components/lesson/lesson-navigation-bar"
import { useLessonAnswerRecorder } from "@/components/lesson/use-lesson-answer-recorder"
import { useLessonRunnerState } from "@/components/lesson/use-lesson-runner-state"
import { useLessonStepPractice } from "@/components/lesson/use-lesson-step-practice"
import { PracticeSaveError } from "@/components/practice/practice-save-error"

interface LessonRunnerProps {
  lesson: Lesson
}

export function LessonRunner({ lesson }: LessonRunnerProps) {
  const {
    progress,
    mistakes,
    loaded,
    savedLessonProgress,
    lessonUnlocked,
    recommendedLesson,
    stepIndex,
    current,
    isLast,
    practiceSteps,
    persistedStepAnswers,
    setAnsweredForLesson,
    lessonView,
    saveError,
    setSaveError,
    setManualStepIndex,
    completeCurrentLesson,
  } = useLessonRunnerState(lesson)
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
    persistedAnswers: persistedStepAnswers,
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
    restoredAnswer: persistedStepAnswers[current.id],
    setSaveError,
  })

  const playAudio = (text: string) => speakJapaneseRepeated(text, { repeat: 1, gapMs: 200 })

  useEffect(() => () => cancelJapaneseSpeech(), [current.id, lesson.id])

  const goNext = () => {
    if (!loaded) return
    if (!lessonUnlocked && isLast) return
    if (isLast) {
      completeCurrentLesson(completionScore)
      return
    }
    setManualStepIndex(Math.min(stepIndex + 1, lesson.steps.length - 1))
    resetStepState()
  }

  const goBack = () => {
    setManualStepIndex(Math.max(stepIndex - 1, 0))
    resetStepState()
  }

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      <div className="paper-wrap py-8 md:py-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              返回今日学习
            </Link>
          </Button>
          <div className="text-xs font-semibold text-muted-foreground">
            N5–N2 · Day {lessonPosition}/{STARTER_LESSONS.length} · {lesson.estimatedMinutes} 分钟
          </div>
        </div>

        {loaded && !lessonUnlocked ? <LessonLockedPreview recommendedLesson={recommendedLesson} /> : null}

        <div className="grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-12">
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

          <main className="paper-sheet p-5 sm:p-8">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="eyebrow mb-1">{stepLabel(current.type)}</div>
                <h2 className="font-brush text-3xl font-normal">{current.title}</h2>
              </div>
              {"audioText" in current && current.audioText ? (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  aria-label="朗读当前课程内容"
                  onClick={() => playAudio(current.audioText!)}
                >
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

            {current.type === "summary" && hasCompletedLesson ? <LessonCompletionRecap lesson={lesson} /> : null}

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
