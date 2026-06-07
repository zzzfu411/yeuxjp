export type AnswerOptionFeedback = "idle" | "correct" | "wrong" | "dimmed"

const ANSWER_OPTION_CLASS_NAMES: Record<AnswerOptionFeedback, string> = {
  idle: "",
  correct:
    "bg-green-100 border-green-500 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:border-green-500 dark:text-green-400",
  wrong:
    "bg-red-100 border-red-500 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:border-red-500 dark:text-red-400",
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
