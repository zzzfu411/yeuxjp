import type { Question } from "@/lib/questions"
import { buildMistakeId, normalizeMistakeList } from "@/lib/mistake-notebook-model"
import { getMistakeRetirement } from "@/lib/mistake-review-compatibility"
import { contentFingerprint } from "@/lib/content-fingerprint"
import { getQuestionContentVersion } from "@/lib/question-content-version"
import { createSrsState, normalizeSrsState, type SrsState } from "@/lib/srs-model"

export type KnowledgeReviewCard = { id: string; question: Question; srs: SrsState }
export type KnowledgeReviewMap = Record<string, KnowledgeReviewCard>

export function knowledgeReviewId(question: Question) {
  return contentFingerprint([question.itemType, question.itemId, question.questionVersion, getQuestionContentVersion(question)])
}

export function normalizeKnowledgeReviews(input: unknown): KnowledgeReviewMap | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null
  const cards: KnowledgeReviewMap = {}
  for (const [id, value] of Object.entries(input)) {
    if (!value || typeof value !== "object") return null
    const raw = value as Partial<KnowledgeReviewCard>
    if (raw.id !== id || !raw.question || !raw.srs || typeof raw.srs !== "object" || Array.isArray(raw.srs)) return null
    const q = raw.question
    const snapshot = normalizeMistakeList([{ ...q, id: q.mistakeId ?? buildMistakeId(q), createdAt: 0, lastWrongAt: 0 }], 0)[0]
    if (!snapshot || !snapshot.itemId || !["grammar", "sentence"].includes(snapshot.itemType ?? "") || !snapshot.mode) return null
    const question: Question = { type: snapshot.type, itemId: snapshot.itemId, itemType: snapshot.itemType, mode: snapshot.mode,
      questionText: snapshot.questionText, questionAudio: snapshot.questionAudio, correctAnswer: snapshot.correctAnswer,
      correctDisplay: snapshot.correctDisplay, acceptedAnswers: snapshot.acceptedAnswers, explanation: snapshot.explanation,
      options: snapshot.options, meta: snapshot.meta,
      ...(typeof q.mistakeId === "string" ? { mistakeId: q.mistakeId } : {}), ...(snapshot.questionVersion ? { questionVersion: snapshot.questionVersion } : {}),
      ...(["choice", "assembly", "input"].includes(q.responseFormat ?? "") ? { responseFormat: q.responseFormat } : {}),
      ...(Array.isArray(q.chunks) && q.chunks.every(c => typeof c === "string") ? { chunks: q.chunks } : {}),
    }
    const legacyId = contentFingerprint([question.itemType, question.itemId, question.questionVersion ?? getQuestionContentVersion(question)])
    if (knowledgeReviewId(question) !== id && legacyId !== id) return null
    cards[id] = { id, question, srs: normalizeSrsState(raw.srs, 0) }
  }
  return cards
}

export function isCurrentKnowledgeCard(card: KnowledgeReviewCard) {
  const q = card.question
  return !getMistakeRetirement({ ...q, id: q.mistakeId ?? buildMistakeId(q), wrongCount: 1, createdAt: 0, lastWrongAt: 0 })
}

export function enrollKnowledgeCard(previous: KnowledgeReviewMap, question: Question, now: number) {
  if (!question.itemId || !["grammar", "sentence"].includes(question.itemType ?? "")) return previous
  const id = knowledgeReviewId(question)
  if (previous[id] || Object.values(previous).some(card => knowledgeReviewId(card.question) === id && isCurrentKnowledgeCard(card))) return previous
  return { ...previous, [id]: { id, question, srs: createSrsState(now) } }
}
