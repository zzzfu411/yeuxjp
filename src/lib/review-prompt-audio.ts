import type { Question } from "@/lib/questions"

/** Filled-sentence audio would reveal a grammar/recall answer before submission. */
export function reviewPromptAudio(question: Pick<Question, "mode" | "type" | "questionAudio">) {
  return question.mode === "listening" || question.type.startsWith("audio-") || question.type === "lesson:dictation"
    ? question.questionAudio : undefined
}
