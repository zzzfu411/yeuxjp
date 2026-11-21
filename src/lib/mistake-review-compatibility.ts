import { AMBIGUOUS_VOCAB_GLOSSES, GRAMMAR_REVIEW_VERSIONS, LESSON_REVIEW_VERSIONS } from "@/data/review-compatibility-index"
import { buildMistakeId, type MistakeItem } from "@/lib/mistake-notebook-model"
import { contentFingerprint } from "@/lib/content-fingerprint"
import { getQuestionContentVersion } from "@/lib/question-content-version"
import { normalizeAnswer } from "@/lib/questions"

export type RetiredMistake = { item: MistakeItem; reason: string; href?: string }
const homophones = [["ji", "di"], ["zu", "du"], ["o", "wo"]]
const glosses = new Map(AMBIGUOUS_VOCAB_GLOSSES)

/** A read-only projection: never delete old answers or rewrite historical SRS data. */
export function getMistakeRetirement(item: MistakeItem): RetiredMistake | null {
  if (item.archived) return { item, reason: "原题记录已由新版本替代，保留于此供追溯。" }
  if (item.type === "audio-kana") {
    const pair = homophones.find(group => group.includes(item.correctAnswer))
    if (pair && item.options.some(option => option.value !== item.correctAnswer && pair.includes(option.value))) {
      return { item, reason: "孤立音频无法区分这些同音假名，旧题不再用于判错。", href: "/quiz?mode=audio-kana" }
    }
  }
  if (item.type === "review:vocab" && item.mode === "recall") {
    const equivalents = glosses.get(normalizeAnswer(item.questionText ?? ""))
    if (equivalents?.includes(item.correctAnswer) && item.options.some(option => option.value !== item.correctAnswer && equivalents.includes(option.value))) {
      return { item, reason: "这道题仅给出相同中文释义，却要求区分多个合理日语答案。", href: "/vocabulary" }
    }
  }
  if (item.type.startsWith("lesson:")) {
    const entries = LESSON_REVIEW_VERSIONS[contentFingerprint(buildMistakeId(item))]
    const compatible = entries?.some(([version, legacy]) => item.questionVersion ? version === item.questionVersion : legacy)
    if (!compatible) return { item, reason: "课程题目已修订或移除；旧快照不再作为当前答题依据，请回到课程补学。", href: entries?.[0]?.[2] ?? "/path" }
  }
  if (item.type === "grammar-practice") {
    const entry = GRAMMAR_REVIEW_VERSIONS[item.id]
    const snapshotVersion = getQuestionContentVersion(item)
    if (!entry || entry[0] !== snapshotVersion || (item.questionVersion && item.questionVersion !== entry[0])) {
      return { item, reason: "语法题的题干、选项或讲解已更新，旧快照暂停复习。", href: entry?.[1] ?? "/grammar" }
    }
  }
  return null
}

export function partitionReviewMistakes(items: readonly MistakeItem[]) {
  const active: MistakeItem[] = []
  const retired: RetiredMistake[] = []
  for (const item of items) {
    const retirement = getMistakeRetirement(item)
    if (retirement) retired.push(retirement)
    else active.push(item)
  }
  return { active, retired }
}
