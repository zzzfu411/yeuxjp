export type AnswerOptionFeedback = "idle" | "correct" | "wrong" | "dimmed"

const ANSWER_OPTION_CLASS_NAMES: Record<AnswerOptionFeedback, string> = {
  idle: "",
  correct:
    "border-primary/45 bg-primary/10 text-foreground hover:bg-primary/10 dark:border-primary/45 dark:bg-primary/10 dark:text-foreground",
  wrong:
    "border-destructive/65 bg-destructive/10 text-foreground hover:bg-destructive/10 dark:border-destructive/65 dark:bg-destructive/10 dark:text-foreground",
  dimmed: "opacity-50",
}

export function getAnswerOptionFeedback({
  selectedAnswer,
  optionValue,
  isCorrectOption,
}: {
  selectedAnswer: string | null | undefined
  optionValue: string
  isCorrectOption: boolean
}): AnswerOptionFeedback {
  if (selectedAnswer == null) return "idle"
  if (isCorrectOption) return "correct"
  if (selectedAnswer === optionValue) return "wrong"
  return "dimmed"
}

export function getAnswerOptionClassName(feedback: AnswerOptionFeedback) {
  return ANSWER_OPTION_CLASS_NAMES[feedback]
}

export function shouldShowCorrectAnswerIcon(feedback: AnswerOptionFeedback) {
  return feedback === "correct"
}

export function shouldShowWrongAnswerIcon(feedback: AnswerOptionFeedback) {
  return feedback === "wrong"
}

export function getAnswerOptionAriaLabel(display: string, feedback: AnswerOptionFeedback) {
  if (feedback === "correct") return `${display}，正确答案`
  if (feedback === "wrong") return `${display}，你的选择，回答错误`
  if (feedback === "dimmed") return `${display}，未选择`
  return display
}
