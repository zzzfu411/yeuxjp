"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { CheckCircle2, RotateCcw } from "lucide-react"
import type { GrammarPoint } from "@/data/grammar-data"
import { PracticeSaveError } from "@/components/practice/practice-save-error"
import { QuizOptionGrid } from "@/components/quiz/quiz-option-grid"
import { ReviewAnswerFeedback } from "@/components/review/review-answer-feedback"
import { Button } from "@/components/ui/button"
import { buildGrammarPracticeQuestions } from "@/lib/grammar-practice"
import { recordQuestionPractice } from "@/lib/learning-session"
import { runLearningWrite } from "@/lib/learning-write-lock"
import { useLearningStatus } from "@/lib/learning-status"
import { useMistakeNotebook } from "@/lib/mistake-notebook"
import { makeQuestionResult, type QuestionResult } from "@/lib/questions"

type PracticePhase = "idle" | "active" | "complete"

export function GrammarPracticePanel({ point }: { point: GrammarPoint }) {
  const questions = useMemo(() => buildGrammarPracticeQuestions(point), [point])
  const learning = useLearningStatus()
  const notebook = useMistakeNotebook()
  const [phase, setPhase] = useState<PracticePhase>("idle")
  const [questionIndex, setQuestionIndex] = useState(0)
  const [result, setResult] = useState<QuestionResult | null>(null)
  const [results, setResults] = useState<QuestionResult[]>([])
  const [saveError, setSaveError] = useState(false)
  const answerLockedRef = useRef(false)
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  if (!questions.length) return null

  const currentQuestion = questions[questionIndex]
  const correctCount = results.filter((item) => item.correct).length

  function startPractice() {
    setPhase("active")
    setQuestionIndex(0)
    setResult(null)
    setResults([])
    setSaveError(false)
    answerLockedRef.current = false
  }

  async function selectAnswer(selectedAnswer: string) {
    if (result || answerLockedRef.current) return
    answerLockedRef.current = true

    const nextResult = makeQuestionResult(currentQuestion, selectedAnswer)
    const saved = await runLearningWrite(() => mountedRef.current && recordQuestionPractice({
      progress: learning,
      notebook,
      result: nextResult,
      enrollReviewOnCorrect: false,
    }))

    if (!mountedRef.current) return

    if (!saved) {
      setSaveError(true)
      answerLockedRef.current = false
      return
    }

    setSaveError(false)
    setResult(nextResult)
    setResults((current) => [...current, nextResult])
  }

  function continuePractice() {
    if (!result) return
    answerLockedRef.current = false
    if (questionIndex >= questions.length - 1) {
      setPhase("complete")
      setResult(null)
      return
    }

    setQuestionIndex((current) => current + 1)
    setResult(null)
    setSaveError(false)
  }

  if (phase === "idle") {
    return (
      <section className="space-y-3 border-y border-border/45 bg-primary/[0.035] p-5 text-center">
        <div>
          <h3 className="eyebrow text-base text-foreground">专项练习 · practice</h3>
          <p className="mt-1 text-sm text-muted-foreground">用 {questions.length} 道题检查这个语法点。</p>
        </div>
        <Button onClick={startPractice} data-testid="grammar-practice-start">
          开始练习
        </Button>
      </section>
    )
  }

  if (phase === "complete") {
    return (
      <section
        className="border-y border-border/50 bg-primary/[0.035] p-5 text-center"
        data-testid="grammar-practice-summary"
      >
        <CheckCircle2 className="mx-auto h-8 w-8 text-foreground/60" />
        <h3 className="mt-3 text-lg font-semibold">本组练习完成</h3>
        <p className="font-scribble mt-1 text-base text-muted-foreground">
          答对 {correctCount} / {results.length} 题
        </p>
        <Button variant="outline" className="mt-4 gap-2" onClick={startPractice} data-testid="grammar-practice-restart">
          <RotateCcw className="h-4 w-4" />
          重新练习
        </Button>
      </section>
    )
  }

  return (
    <section className="space-y-5 border-y border-border/50 bg-primary/[0.025] p-5" aria-label={`${point.title} 专项练习`}>
      <div className="flex items-center justify-between gap-4 text-sm">
        <h3 className="eyebrow text-base text-foreground">专项练习 · practice</h3>
        <span className="font-scribble text-base text-muted-foreground">
          {questionIndex + 1} / {questions.length}
        </span>
      </div>

      <p className="text-lg font-medium leading-relaxed" data-testid="grammar-practice-question">
        {currentQuestion.questionText}
      </p>

      <QuizOptionGrid
        question={currentQuestion}
        selectedOption={result?.selectedAnswer ?? null}
        onSelect={selectAnswer}
        testIdPrefix="grammar-practice-answer"
      />

      <PracticeSaveError show={saveError} />

      {result ? (
        <div data-testid="grammar-practice-feedback">
          <ReviewAnswerFeedback
            question={currentQuestion}
            selectedAnswer={result.selectedAnswer}
            correct={result.correct}
            showSelectedAnswer
          />
        </div>
      ) : null}

      {result ? (
        <Button className="w-full" onClick={continuePractice} data-testid="grammar-practice-next">
          {questionIndex === questions.length - 1 ? "查看结果" : "下一题"}
        </Button>
      ) : null}
    </section>
  )
}
