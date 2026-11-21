"use client"
import { STORAGE_KEYS } from "@/lib/storage-keys"
import { readJsonStorage, validJsonStorageValue, invalidJsonStorageValue } from "@/lib/storage-read-result"
import { writeLearningJson } from "@/lib/learning-storage"
import { enrollKnowledgeCard, isCurrentKnowledgeCard, normalizeKnowledgeReviews, type KnowledgeReviewMap } from "@/lib/knowledge-review-model"
import { applySrsResult, type SrsResult } from "@/lib/srs-model"
import type { Question } from "@/lib/questions"

export function readKnowledgeReviews() {
  return readJsonStorage(STORAGE_KEYS.KNOWLEDGE_REVIEWS, {} as KnowledgeReviewMap, input => {
    const normalized = normalizeKnowledgeReviews(input)
    return normalized ? validJsonStorageValue(normalized) : invalidJsonStorageValue<KnowledgeReviewMap>()
  }, "knowledge-review")
}

export function enrollKnowledgeReview(question: Question, now = Date.now()) {
  const current = readKnowledgeReviews()
  if (!current.ok) return false
  const next = enrollKnowledgeCard(current.value, question, now)
  if (next === current.value) return true
  return writeLearningJson(STORAGE_KEYS.KNOWLEDGE_REVIEWS, next, { expectedRaw: current.raw })
}

export function hasKnowledgeReview(id: string) {
  const current = readKnowledgeReviews()
  return current.ok && !!current.value[id] && isCurrentKnowledgeCard(current.value[id])
}

export function gradeKnowledgeReview(id: string, result: SrsResult, now = Date.now()) {
  const current = readKnowledgeReviews()
  const card = current.value[id]
  if (!current.ok || !card || !isCurrentKnowledgeCard(card)) return false
  return writeLearningJson(STORAGE_KEYS.KNOWLEDGE_REVIEWS, { ...current.value,
    [id]: { ...card, srs: applySrsResult(card.srs, result, now) },
  }, { expectedRaw: current.raw })
}
