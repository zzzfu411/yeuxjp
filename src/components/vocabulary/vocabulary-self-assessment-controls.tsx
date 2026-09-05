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
  again: "is-selected",
  hard: "is-selected",
  good: "is-selected",
} as const

export function VocabularySelfAssessmentControls({
  value,
  onSelect,
}: {
  value: VocabularySelfAssessment | null
  onSelect: (rating: VocabularySelfAssessment) => void
}) {
  return (
    <div className="space-y-3 border-t border-border/40 pt-5">
      <div>
        <span className="eyebrow">记忆反馈</span>
        <span className="ml-2 text-sm text-foreground">这次记得吗？</span>
      </div>
      <div className="grid grid-cols-3 gap-2" role="group" aria-label="本次词汇回忆自评">
        {VOCABULARY_SELF_ASSESSMENT_OPTIONS.map((option) => {
          const Icon = iconByRating[option.id]
          const selected = value === option.id
          return (
            <Button
              key={option.id}
              type="button"
              variant="outline"
              data-rating={option.id}
              className={cn(
                "recall-option h-auto min-h-16 flex-col gap-1 whitespace-normal px-2 py-3 font-normal shadow-none disabled:opacity-50",
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
