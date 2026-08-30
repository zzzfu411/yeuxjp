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
  again: "border-accent bg-accent/[0.05] text-accent",
  hard: "border-accent bg-accent/[0.05] text-accent",
  good: "border-accent bg-accent/[0.05] text-accent",
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
        <span className="eyebrow">记忆 · Recall</span>
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
              className={cn(
                "ledger-row h-auto min-h-16 flex-col gap-1 whitespace-normal rounded-none border-0 border-b border-border/50 bg-transparent px-2 py-3 font-normal shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-muted/35 hover:shadow-none disabled:opacity-50",
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
