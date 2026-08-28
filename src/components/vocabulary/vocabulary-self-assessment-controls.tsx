"use client"

import { Brain, CheckCircle2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  getVocabularySelfAssessmentOption,
  VOCABULARY_SELF_ASSESSMENT_OPTIONS,
  type VocabularySelfAssessment,
} from "@/lib/vocabulary-self-assessment"

const iconByRating = {
  again: RotateCcw,
  hard: Brain,
  good: CheckCircle2,
} as const

const selectedClassByRating = {
  again: "border-red-300 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300",
  hard: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-200",
  good: "border-green-300 bg-green-50 text-green-700 dark:border-green-900/70 dark:bg-green-950/30 dark:text-green-300",
} as const

export function VocabularySelfAssessmentControls({
  value,
  onSelect,
}: {
  value: VocabularySelfAssessment | null
  onSelect: (rating: VocabularySelfAssessment) => void
}) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-foreground">这次记得吗？</div>
      <div className="grid grid-cols-3 gap-2" role="group" aria-label="本次词汇回忆自评">
        {VOCABULARY_SELF_ASSESSMENT_OPTIONS.map((option) => {
          const Icon = iconByRating[option.id]
          const selected = value === option.id
          return (
            <Button
              key={option.id}
              type="button"
              variant="outline"
              className={cn(
                "h-auto min-h-16 flex-col gap-1 px-2 py-3 whitespace-normal disabled:opacity-50",
                selected && "disabled:opacity-100",
                selected && selectedClassByRating[option.id]
              )}
              aria-pressed={selected}
              disabled={value !== null}
              data-testid={`vocabulary-self-grade-${option.id}`}
              onClick={(event) => {
                event.stopPropagation()
                onSelect(option.id)
              }}
            >
              <Icon className="h-4 w-4" />
              <span>{option.label}</span>
            </Button>
          )
        })}
      </div>

      {value ? (
        <p
          className="text-sm leading-relaxed text-muted-foreground"
          role="status"
          aria-live="polite"
          data-testid="vocabulary-self-grade-status"
        >
          {getVocabularySelfAssessmentOption(value).feedback}
        </p>
      ) : null}
    </div>
  )
}
