"use client"

import { cn } from "@/lib/utils"
import { isQuestionAnswerCorrect } from "@/lib/questions"
import { conjugateVerb, getVerbConjFormsForVerb, type VerbConjForm, type VerbKind } from "@/lib/verb-conjugation"

function splitBlank(sentence: string) {
  const idx = sentence.indexOf("＿")
  if (idx === -1) return { before: sentence, after: "" }
  const before = sentence.slice(0, idx)
  const after = sentence.slice(idx + 1)
  return { before, after }
}

function ParticleFilledLine({
  before,
  after,
  label,
  particle,
  particleClassName,
}: {
  before: string
  after: string
  label: string
  particle: string
  particleClassName: string
}) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-jp text-lg font-medium leading-relaxed">
        {before}
        <span className={cn("mx-0.5 border-b px-1", particleClassName)}>{particle}</span>
        {after}
      </div>
    </div>
  )
}

function isFeedbackAnswerCorrect(correct: string, selected: string, acceptedAnswers?: string[]) {
  return isQuestionAnswerCorrect({ correctAnswer: correct, acceptedAnswers }, selected)
}

export function ParticleFillFeedback({
  sentence,
  selected,
  correct,
  acceptedAnswers,
  className,
}: {
  sentence: string
  selected: string
  correct: string
  acceptedAnswers?: string[]
  className?: string
}) {
  const { before, after } = splitBlank(sentence)

  const isCorrect = isFeedbackAnswerCorrect(correct, selected, acceptedAnswers)

  return (
    <div className={cn("w-full space-y-3 border-y border-dashed border-border/60 bg-primary/5 p-4", className)}>
      <div className="text-xs font-semibold text-foreground tracking-wider">句子回填</div>

      {isCorrect ? (
        <ParticleFilledLine
          before={before}
          after={after}
          label="正确"
          particle={correct}
          particleClassName="border-foreground/50 bg-primary/10 text-foreground"
        />
      ) : (
        <>
          <ParticleFilledLine
            before={before}
            after={after}
            label="你的答案"
            particle={selected}
            particleClassName="border-accent/70 bg-accent/10 text-accent"
          />
          <ParticleFilledLine
            before={before}
            after={after}
            label="正确答案"
            particle={correct}
            particleClassName="border-foreground/50 bg-primary/10 text-foreground"
          />
        </>
      )}
    </div>
  )
}

export type ConjugationVerbMeta = {
  dict: string
  kanji?: string
  meaning: string
  kind: VerbKind
}

export function ConjugationComparison({
  verb,
  askedForm,
  selected,
  correct,
  acceptedAnswers,
  className,
}: {
  verb: ConjugationVerbMeta
  askedForm: { id: VerbConjForm; label: string }
  selected: string
  correct: string
  acceptedAnswers?: string[]
  className?: string
}) {
  const baseName = verb.kanji ? `${verb.kanji}（${verb.dict}）` : verb.dict
  const isCorrect = isFeedbackAnswerCorrect(correct, selected, acceptedAnswers)

  const allForms: { id: "dict" | VerbConjForm; label: string; value: string }[] = [
    { id: "dict", label: "辞书形", value: verb.dict },
    ...getVerbConjFormsForVerb(verb).map((f) => ({
      id: f.id,
      label: f.label,
      value: conjugateVerb(verb.dict, verb.kind, f.id),
    })),
  ]

  return (
    <div className={cn("w-full space-y-4 border-y border-dashed border-border/60 bg-primary/5 p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-foreground tracking-wider">活用对照表</div>
          <div className="text-sm text-muted-foreground">
            {baseName}（{verb.meaning}）→ <span className="font-semibold text-foreground">{askedForm.label}</span>
          </div>
        </div>

        <div
          className={cn(
            "whitespace-nowrap border px-3 py-1 text-xs font-semibold",
            isCorrect
              ? "border-foreground/30 bg-primary/10 text-foreground"
              : "seal-stamp border-accent/70 bg-accent/5 text-accent"
          )}
        >
          {isCorrect ? "正确" : "已记录错题"}
        </div>
      </div>

      {!isCorrect && (
        <div className="grid grid-cols-2 gap-2">
          <div className="border-b border-dashed border-accent/50 bg-accent/5 p-3">
            <div className="text-xs text-muted-foreground mb-1">你的选择</div>
            <div className="font-jp text-lg font-semibold text-accent">{selected}</div>
          </div>
          <div className="border-b border-dashed border-foreground/30 bg-primary/5 p-3">
            <div className="text-xs text-muted-foreground mb-1">正确答案</div>
            <div className="font-jp text-lg font-semibold text-foreground">{correct}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {allForms.map((f) => {
          const isAsked = f.id === askedForm.id
          return (
            <div
              key={f.id}
              className={cn(
                "ledger-row border-l-2 border-l-transparent bg-transparent p-3",
                isAsked && "border-l-accent bg-primary/10"
              )}
            >
              <div className="text-xs text-muted-foreground mb-1">{f.label}</div>
              <div className="text-lg font-semibold">{f.value}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
