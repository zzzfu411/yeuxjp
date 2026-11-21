import { GRAMMAR_REVIEW_FAMILIES, COMPREHENSION_REVIEW_FAMILIES, COMPREHENSION_FAMILY_BY_VERSION } from "@/data/knowledge-review-variants"
import type { KnowledgeReviewCard } from "@/lib/knowledge-review-model"
import type { Question } from "@/lib/questions"
import type { SrsState } from "@/lib/srs-model"

export { snapshotKnowledgeReviewItems } from "@/lib/knowledge-review-snapshot"

type KnowledgePresentation = { question: Question; prompt: string; note: string; kind: "original" | "grammar" | "comprehension" | "recall-input" }

export function getKnowledgeReviewVariant(card: KnowledgeReviewCard, state: SrsState, now: number): KnowledgePresentation {
  const source = card.question
  const original = (note: string): KnowledgePresentation => ({ question: source, prompt: source.questionText ?? "完成这道复习题", kind: "original", note })
  if (state.right < 1 || state.box < 2) return original("先巩固原题，再逐步尝试变式。")
  if (now < state.dueAt) return original("这项尚未到期，可以先回顾原题。")
  if (now - state.dueAt > 7 * 24 * 60 * 60 * 1000) return original("这项间隔较久，先回到原题巩固。")

  if (source.chunks?.length && source.type === "lesson:sentenceBuild" && state.box >= 3 && state.right >= 2 && state.right % 2 === 0) {
    return { question: { ...source, chunks: undefined, responseFormat: "input", mode: "recall" },
      prompt: source.questionText?.split("\n\n").slice(1).join("\n\n") || source.questionText || "回忆本课原句",
      kind: "recall-input", note: "不提供词块：按中文回忆本课原句，使用本课学过的词汇。这是句型回忆练习。" }
  }
  if (source.chunks?.length) return original("词块组句：继续巩固本课句型。")
  const grammar = source.itemType === "grammar" && source.mode === "recognition" ? GRAMMAR_REVIEW_FAMILIES[source.itemId ?? ""] : undefined
  const family = source.questionVersion ? COMPREHENSION_FAMILY_BY_VERSION[source.questionVersion] : undefined
  const alternatives = grammar ?? (family ? COMPREHENSION_REVIEW_FAMILIES[family] : undefined)
  if (!alternatives?.length) return original("当前没有已编写的同内容变式，继续回顾原题。")
  const pool = [source, ...alternatives.filter(question => question.questionVersion !== source.questionVersion)]
  const question = pool[state.right % pool.length]
  if (question === source) return original("轮换回顾：这次重新检验原题。")
  return { question, prompt: question.questionText ?? "完成这道复习题", kind: grammar ? "grammar" : "comprehension",
    note: grammar ? "同一语法点，换一个例句来判断。" : "同一篇材料，换一个理解角度来作答。" }
}
