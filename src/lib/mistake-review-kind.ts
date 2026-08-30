import type { MistakeItem } from "@/lib/mistake-notebook-model"

export type MistakeReviewKind = "grammar" | "sentence" | "kana" | "vocab" | "other"

export type ReviewMistakeKindDue = {
  vocab: number
  grammar: number
  kana: number
  sentence: number
  other: number
}

type MistakeKindInput = Pick<MistakeItem, "itemType" | "type">
type MistakeKindItem = Pick<MistakeItem, "id" | "itemType" | "type">

const KIND_ORDER: readonly MistakeReviewKind[] = ["vocab", "grammar", "kana", "sentence", "other"]

const KIND_LABELS: Record<MistakeReviewKind, string> = {
  vocab: "词汇",
  grammar: "语法",
  kana: "假名",
  sentence: "造句",
  other: "其他",
}

export function emptyReviewMistakeKindDue(): ReviewMistakeKindDue {
  return { vocab: 0, grammar: 0, kana: 0, sentence: 0, other: 0 }
}

export function mistakeReviewKind(mistake: MistakeKindInput): MistakeReviewKind {
  if (mistake.itemType === "grammar" || mistake.type.includes("grammar") || mistake.type.includes("verb")) return "grammar"
  if (mistake.itemType === "sentence") return "sentence"
  if (mistake.itemType === "kana") return "kana"
  if (mistake.itemType === "vocab") return "vocab"
  return "other"
}

export function mistakeReviewDeckLabel(mistake: MistakeKindInput) {
  const kind = mistakeReviewKind(mistake)
  if (kind === "grammar") return "语法错题"
  if (kind === "sentence") return "造句错题"
  if (kind === "kana") return "假名错题"
  if (kind === "vocab") return "词汇错题"
  return "错题"
}

export function countDueMistakesByKind(dueIds: Iterable<string>, items: Iterable<MistakeKindItem>): ReviewMistakeKindDue {
  const itemById = new Map<string, MistakeKindInput>()
  for (const item of items) {
    itemById.set(item.id, item)
  }

  const counts = emptyReviewMistakeKindDue()
  for (const id of dueIds) {
    const item = itemById.get(id)
    counts[item ? mistakeReviewKind(item) : "other"] += 1
  }
  return counts
}

export function formatMistakeKindDue(counts: ReviewMistakeKindDue) {
  const parts: string[] = []
  for (const kind of KIND_ORDER) {
    const n = counts[kind]
    if (n > 0) parts.push(`${KIND_LABELS[kind]} ${n}`)
  }
  return parts.join(" · ")
}
