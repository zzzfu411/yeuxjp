"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { ArrowLeft, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Lesson, LessonStep } from "@/data/lesson-types"
import { STARTER_LESSONS } from "@/data/lesson-catalog"
import { isPracticeStep } from "@/lib/lesson-step-kind"
import { cancelJapaneseSpeech, speakJapaneseRepeated } from "@/lib/speech"
import { LessonCompletionRecap } from "@/components/lesson/lesson-completion-recap"
import { LessonConsolidation } from "@/components/lesson/lesson-consolidation"
import { LessonPracticeFeedback } from "@/components/lesson/lesson-practice-feedback"
import { LessonStepBody } from "@/components/lesson/lesson-step-body"
import { LessonStudyMaterials } from "@/components/lesson/lesson-study-materials"
import { LessonProgressSidebar } from "@/components/lesson/lesson-progress-sidebar"
import { LessonLockedPreview } from "@/components/lesson/lesson-locked-preview"
import { LessonNavigationBar } from "@/components/lesson/lesson-navigation-bar"
import { useLessonAnswerRecorder } from "@/components/lesson/use-lesson-answer-recorder"
import { useLessonRunnerState } from "@/components/lesson/use-lesson-runner-state"
import { useLessonStepPractice } from "@/components/lesson/use-lesson-step-practice"
import { PracticeSaveError } from "@/components/practice/practice-save-error"
import { nextLessonStepIndex } from "@/lib/lesson-content-version"

interface LessonRunnerProps {
  lesson: Lesson
}

export function LessonRunner({ lesson }: LessonRunnerProps) {
  const contentRef = useRef<HTMLElement>(null)
  const lastStepRef = useRef<string | null>(null)
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
    restartCurrentLesson,
    revealCurrentHint,
    lessonUpdates,
    resumeUpdatedContent,
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
    attemptId: savedLessonProgress?.attemptId,
    hintedStepIds: savedLessonProgress?.hintedStepIds,
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
  useEffect(() => {
    if (lastStepRef.current && lastStepRef.current !== current.id) contentRef.current?.scrollIntoView({ block: "start" })
    lastStepRef.current = current.id
  }, [current.id])

  const goNext = () => {
    if (!loaded) return
    if (!lessonUnlocked && isLast) return
    if (isLast) {
      completeCurrentLesson(completionScore)
      return
    }
    setManualStepIndex(nextLessonStepIndex(lesson, stepIndex, 1, savedLessonProgress?.updateStepIds))
    resetStepState()
  }

  const goBack = () => {
    setManualStepIndex(nextLessonStepIndex(lesson, stepIndex, -1, savedLessonProgress?.updateStepIds))
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
            N5–N2 · 第 {lessonPosition}/{STARTER_LESSONS.length} 课 · 建议 {lesson.estimatedMinutes} 分钟，可分次
          </div>
        </div>

        {loaded && !lessonUnlocked ? <LessonLockedPreview recommendedLesson={recommendedLesson} /> : null}

        <div className="grid gap-4 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-12">
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

          <section ref={contentRef} aria-label="课程内容" className="paper-sheet lesson-stage scroll-mt-24 p-5 sm:p-8">
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

            {lesson.study && current.id === lesson.steps.find(step => step.type === "explain")?.id && <LessonStudyMaterials lessonId={lesson.id} study={lesson.study} mode="instruction" onPlay={playAudio} />}
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
              attemptSeed={`${lesson.id}:${savedLessonProgress?.attemptId ?? savedLessonProgress?.startedAt ?? 0}`}
              hintUsed={savedLessonProgress?.hintedStepIds?.includes(current.id)}
              onRevealHint={revealCurrentHint}
            />

            {lesson.study && current.id === lesson.steps.find(step => step.type === "example")?.id && <LessonStudyMaterials lessonId={lesson.id} study={lesson.study} mode="reading" onPlay={playAudio} />}
            {lesson.study && current.type === "summary" && <LessonStudyMaterials lessonId={lesson.id} study={lesson.study} mode="production" onPlay={playAudio} />}

            {result && isPracticeStep(current) ? (
              <LessonPracticeFeedback step={current} result={result} assisted={savedLessonProgress?.hintedStepIds?.includes(current.id)} />
            ) : null}

            <PracticeSaveError show={saveError} />

            {current.type === "summary" && hasCompletedLesson ? <LessonCompletionRecap lesson={lesson} /> : null}
            {current.type === "summary" && loaded && lessonUnlocked && hasCompletedLesson ? <LessonConsolidation lesson={lesson} progress={savedLessonProgress} onPractice={() => resumeUpdatedContent(true)} /> : null}
            {current.type === "summary" && loaded && lessonUnlocked ? (
              <div className="mt-5 border-t border-border/40 pt-4 text-sm text-muted-foreground">
                <p>独立答对 {correctCount}/{practiceSteps}。查看提示后的答对保留在练习记录中。</p>
                <Button type="button" variant="outline" className="mt-3" onClick={restartCurrentLesson} data-testid="lesson-restart">重新练习本课</Button>
                {hasCompletedLesson && lessonUpdates.length > 0 ? (
                  <div className="mt-4 space-y-2" data-testid="lesson-content-updates">
                    <p>本课有 {lessonUpdates.length} 项内容新增、修订或尚未记录学习版本。首次完成与成绩保留；旧题答案不用于修订后的题目。</p>
                    <ul className="list-inside list-disc">{lessonUpdates.map(step => <li key={step.id}>{step.title}</li>)}</ul>
                    <Button type="button" variant="outline" onClick={() => resumeUpdatedContent()} data-testid="lesson-resume-updates">仅补学这些内容</Button>
                  </div>
                ) : <p className="mt-2">首次完成记录与成绩会保留，重练成绩单独记录。</p>}
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
          </section>
        </div>
      </div>
    </div>
  )
}

function stepLabel(type: LessonStep["type"]) {
  const labels: Record<LessonStep["type"], string> = {
    explain: "目标与讲解",
    example: "例句与情境阅读",
    multipleChoice: "识别练习",
    typing: "主动回忆",
    dictation: "听写",
    sentenceBuild: "组句输出",
    summary: "小结",
  }
  return labels[type]
}
