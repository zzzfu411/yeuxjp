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
    <div className="w-full flex flex-col items-center justify-center py-12 bg-card border rounded-xl shadow-sm min-h-[200px] relative">
      {question.questionAudio ? (
        <>
          <Button
            variant="outline"
            size="icon"
            className="w-24 h-24 rounded-full border-4"
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
              "font-bold text-foreground block mb-2",
              mode === "verb-conjugation" ? "text-3xl" : "text-6xl"
            )}
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
    </div>
  )
}
