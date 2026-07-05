"use client"

import { cn } from "@/lib/utils"
import { isQuestionAnswerCorrect } from "@/lib/questions"
import { VERB_CONJ_FORMS, conjugateVerb, type VerbConjForm, type VerbKind } from "@/lib/verb-conjugation"

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
      <div className="text-lg leading-relaxed font-medium">
        {before}
        <span className={cn("mx-0.5 px-1 rounded-md border", particleClassName)}>{particle}</span>
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
    <div className={cn("w-full rounded-xl border bg-muted/20 p-4 space-y-3", className)}>
      <div className="text-xs font-semibold text-foreground tracking-wider">句子回填</div>

      {isCorrect ? (
        <ParticleFilledLine
          before={before}
          after={after}
          label="正确"
          particle={correct}
          particleClassName="border-green-300 bg-green-100 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300"
        />
      ) : (
        <>
          <ParticleFilledLine
            before={before}
            after={after}
            label="你的答案"
            particle={selected}
            particleClassName="border-red-300 bg-red-100 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300"
          />
          <ParticleFilledLine
            before={before}
            after={after}
            label="正确答案"
            particle={correct}
            particleClassName="border-green-300 bg-green-100 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300"
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
    ...VERB_CONJ_FORMS.map((f) => ({
      id: f.id,
      label: f.label,
      value: conjugateVerb(verb.dict, verb.kind, f.id),
    })),
  ]

  return (
    <div className={cn("w-full rounded-xl border bg-muted/20 p-4 space-y-3", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-foreground tracking-wider">活用对照表</div>
          <div className="text-sm text-muted-foreground">
            {baseName}（{verb.meaning}）→ <span className="font-semibold text-foreground">{askedForm.label}</span>
          </div>
        </div>

        <div
          className={cn(
            "text-xs font-semibold px-3 py-1 rounded-full border whitespace-nowrap",
            isCorrect
              ? "bg-green-100 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-900/40 dark:text-green-300"
              : "bg-red-100 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-900/40 dark:text-red-300"
          )}
        >
          {isCorrect ? "正确" : "已记录错题"}
        </div>
      </div>

      {!isCorrect && (
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border bg-background/60 p-3">
            <div className="text-xs text-muted-foreground mb-1">你的选择</div>
            <div className="text-lg font-semibold text-red-700 dark:text-red-300">{selected}</div>
          </div>
          <div className="rounded-lg border bg-background/60 p-3">
            <div className="text-xs text-muted-foreground mb-1">正确答案</div>
            <div className="text-lg font-semibold text-green-700 dark:text-green-300">{correct}</div>
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
                "rounded-lg border bg-background/60 p-3",
                isAsked && "border-primary/50 bg-primary/5"
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
