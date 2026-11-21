"use client"
import { useEffect, useMemo, useState } from "react"
import { LEARNING_STORE_EVENT } from "@/lib/learning-events"
import { LEARNING_EVENT } from "@/lib/learning-storage"
import { STORAGE_KEYS } from "@/lib/storage-keys"
import { gradeKnowledgeReview, hasKnowledgeReview, readKnowledgeReviews } from "@/lib/knowledge-review-storage"
import { isCurrentKnowledgeCard, type KnowledgeReviewMap } from "@/lib/knowledge-review-model"

export function useKnowledgeReviews() {
  const [state, setState] = useState({ cards: {} as KnowledgeReviewMap, now: 0, loaded: false, error: false })
  useEffect(() => {
    let cancelled = false
    const sync = () => { if (!cancelled) { const result = readKnowledgeReviews(); setState({ cards: result.value, now: Date.now(), loaded: true, error: !result.ok }) } }
    const onStorage = (event: StorageEvent) => { if (event.key === STORAGE_KEYS.KNOWLEDGE_REVIEWS || event.key === null) sync() }
    const onLearning = () => sync()
    queueMicrotask(sync)
    const timer = window.setInterval(sync, 30000)
    window.addEventListener("storage", onStorage)
    window.addEventListener(LEARNING_EVENT, onLearning)
    window.addEventListener(LEARNING_STORE_EVENT, onLearning)
    return () => { cancelled = true; clearInterval(timer); window.removeEventListener("storage", onStorage)
      window.removeEventListener(LEARNING_EVENT, onLearning); window.removeEventListener(LEARNING_STORE_EVENT, onLearning) }
  }, [])
  return useMemo(() => {
    const cards = Object.values(state.cards).filter(isCurrentKnowledgeCard)
    const map = Object.fromEntries(cards.map(card => [card.id, card.srs]))
    return { cards: new Map(cards.map(card => [card.id, card])), map, loaded: state.loaded, error: state.error,
      retiredCount: Object.keys(state.cards).length - cards.length,
      dueIds: cards.filter(card => card.srs.dueAt <= state.now).sort((a, b) => a.srs.dueAt - b.srs.dueAt).map(card => card.id),
      has: hasKnowledgeReview, gradeExisting: gradeKnowledgeReview }
  }, [state])
}
