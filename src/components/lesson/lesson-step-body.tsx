"use client"

import { CheckCircle2, Headphones, RotateCcw, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { LessonStep } from "@/data/lessons"
import {
  getAnswerOptionAriaLabel,
  getAnswerOptionClassName,
  getAnswerOptionFeedback,
  shouldShowCorrectAnswerIcon,
  shouldShowWrongAnswerIcon,
} from "@/lib/answer-option-feedback"
import { isQuestionAnswerCorrect } from "@/lib/questions"
import { cn } from "@/lib/utils"

export function LessonStepBody({
  step,
  selected,
  typed,
  built,
  result,
  onSelect,
  onTyped,
  onSubmitTyping,
  onPickChunk,
  onUndoChunk,
  onResetChunks,
  onSubmitSentence,
  onPlay,
  readOnly = false,
}: {
  step: LessonStep
  selected: string | null
  typed: string
  built: string[]
  result: "correct" | "wrong" | null
  onSelect: (answer: string) => void
  onTyped: (value: string) => void
  onSubmitTyping: () => void
  onPickChunk: (chunk: string) => void
  onUndoChunk: () => void
  onResetChunks: () => void
  onSubmitSentence: () => void
  onPlay: (text: string) => void
  readOnly?: boolean
}) {
  if (step.type === "explain") {
    return (
      <div className="space-y-5">
        <p className="text-lg leading-8 text-foreground">{step.body}</p>
        {step.bullets?.length ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {step.bullets.map((bullet) => (
              <div key={bullet} className="rounded-xl border bg-muted/20 p-3 text-sm text-muted-foreground">
                {bullet}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    )
  }

  if (step.type === "example") {
    return (
      <div className="rounded-2xl border bg-muted/20 p-6 text-center">
        <div className="text-3xl font-bold leading-relaxed sm:text-4xl">{step.japanese}</div>
        {step.romaji ? <div className="mt-2 text-sm text-muted-foreground">{step.romaji}</div> : null}
        <div className="mt-4 text-lg font-medium">{step.meaning}</div>
        {step.note ? <div className="mt-3 text-sm text-muted-foreground">{step.note}</div> : null}
      </div>
    )
  }

  if (step.type === "multipleChoice") {
    return (
      <div className="space-y-5">
        {step.audioText ? (
          <Button type="button" variant="outline" className="gap-2 rounded-full" onClick={() => onPlay(step.audioText!)}>
            <Headphones className="h-4 w-4" />
            播放题目
          </Button>
        ) : null}
        <div className="rounded-2xl border bg-muted/20 p-5 text-xl font-semibold leading-relaxed">{step.prompt}</div>
        <div className="grid gap-3 sm:grid-cols-2">
          {step.options.map((option) => {
            const feedback = getAnswerOptionFeedback({
              selectedAnswer: result ? selected : null,
              optionValue: option,
              isCorrectOption: isQuestionAnswerCorrect({ correctAnswer: step.answer, acceptedAnswers: step.acceptedAnswers }, option),
            })
            return (
              <Button
                key={option}
                type="button"
                variant="outline"
                className={cn(
                  "min-h-14 justify-start whitespace-normal rounded-xl px-4 py-3 text-left text-base",
                  getAnswerOptionClassName(feedback)
                )}
                aria-label={getAnswerOptionAriaLabel(option, feedback)}
                aria-pressed={selected === option}
                onClick={() => onSelect(option)}
                disabled={readOnly || !!result}
                data-testid={`lesson-answer-${option}`}
              >
                {option}
                {shouldShowCorrectAnswerIcon(feedback) && <CheckCircle2 className="ml-auto h-4 w-4 shrink-0" />}
                {shouldShowWrongAnswerIcon(feedback) && <XCircle className="ml-auto h-4 w-4 shrink-0" />}
              </Button>
            )
          })}
        </div>
      </div>
    )
  }

  if (step.type === "typing" || step.type === "dictation") {
    return (
      <div className="space-y-5">
        {step.type === "dictation" ? (
          <Button type="button" variant="outline" className="gap-2 rounded-full" onClick={() => onPlay(step.audioText)}>
            <Headphones className="h-4 w-4" />
            播放听写
          </Button>
        ) : null}
        <div className="rounded-2xl border bg-muted/20 p-5 text-lg font-semibold leading-relaxed">{step.prompt}</div>
        {step.hint ? <div className="text-sm text-muted-foreground">提示：{step.hint}</div> : null}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={typed}
            onChange={(event) => onTyped(event.target.value)}
            placeholder="输入假名或答案"
            className="h-12 rounded-xl text-lg"
            data-testid="lesson-typing-input"
            disabled={readOnly || !!result}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !readOnly) onSubmitTyping()
            }}
          />
          <Button
            type="button"
            className="h-12 rounded-xl"
            data-testid="lesson-submit-typing"
            onClick={onSubmitTyping}
            disabled={readOnly || !typed.trim() || !!result}
          >
            提交
          </Button>
        </div>
      </div>
    )
  }

  if (step.type === "sentenceBuild") {
    const usedCount = (chunk: string) => built.filter((item) => item === chunk).length
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border bg-muted/20 p-5">
          <div className="text-lg font-semibold">{step.prompt}</div>
          <div className="mt-2 text-sm text-muted-foreground">{step.meaning}</div>
        </div>
        <div className="min-h-16 rounded-2xl border bg-background p-4 text-xl font-semibold">
          {built.length ? built.join(" ") : <span className="text-sm font-normal text-muted-foreground">点击下方词块组句</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          {step.chunks.map((chunk, idx) => {
            const total = step.chunks.filter((item) => item === chunk).length
            const disabled = readOnly || usedCount(chunk) >= total || !!result
            return (
              <Button key={`${chunk}-${idx}`} type="button" variant="outline" className="rounded-full" onClick={() => onPickChunk(chunk)} disabled={disabled}>
                {chunk}
              </Button>
            )
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="gap-2 rounded-full" onClick={onUndoChunk} disabled={readOnly || !built.length || !!result}>
            <RotateCcw className="h-4 w-4" />
            撤销
          </Button>
          <Button type="button" variant="ghost" className="rounded-full" onClick={onResetChunks} disabled={readOnly || !built.length || !!result}>
            清空
          </Button>
          <Button type="button" className="rounded-full" onClick={onSubmitSentence} disabled={readOnly || !built.length || !!result}>
            提交句子
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <p className="text-lg leading-8">{step.body}</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {step.reviewItems.map((item) => (
          <div key={item} className="rounded-xl border bg-muted/20 p-3 text-sm font-medium">
            {item}
          </div>
        ))}
      </div>
      {step.next ? <p className="text-sm text-muted-foreground">{step.next}</p> : null}
    </div>
  )
}
