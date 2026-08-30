"use client"

import { Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Question } from "@/lib/questions"
import type { QuizMode } from "@/lib/quiz-generators"

export function QuizQuestionPrompt({
  question,
  mode,
  onPlayAudio,
}: {
  question: Question
  mode: QuizMode
  onPlayAudio: (text: string) => void
}) {
  return (
    <section className="paper-sheet relative flex min-h-[220px] w-full flex-col items-center justify-center px-5 py-12">
      <span className="paper-tape" aria-hidden />
      {question.questionAudio ? (
        <>
          <Button
            variant="outline"
            size="icon"
            className="h-20 w-20 border border-dashed border-foreground/40 bg-transparent shadow-none hover:border-accent/70 hover:bg-accent/5"
            aria-label="播放题目音频"
            onClick={() => question.questionAudio && onPlayAudio(question.questionAudio)}
          >
            <Volume2 className="w-10 h-10" />
          </Button>
          {question.questionText && (
            <div className="mt-4 text-sm text-muted-foreground text-center px-6">
              {question.questionText}
            </div>
          )}
        </>
      ) : (
        <div className="text-center">
          <span
            className={cn(
              "mb-2 block font-jp font-semibold text-foreground",
              mode === "verb-conjugation" ? "text-3xl" : "text-6xl"
            )}
            data-testid="quiz-question-text"
          >
            {question.questionText}
          </span>
          {mode === "meaning-vocab" && (
            <span className="text-sm text-muted-foreground">What does this mean?</span>
          )}
          {mode === "verb-conjugation" && (
            <span className="text-sm text-muted-foreground">选择正确的活用形</span>
          )}
        </div>
      )}
    </section>
  )
}
