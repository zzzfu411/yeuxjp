"use client"

import { readProgressListResult } from "@/lib/progress-list-storage"
import { readItemProgressMapResult } from "@/lib/learning-progress-storage"
import { STORAGE_KEYS } from "@/lib/storage-keys"
import { buildLearningStatusModel } from "@/lib/learning-status-model"

export function readLearningStatus() {
  const kana = readProgressListResult(STORAGE_KEYS.KANA_MASTERED)
  const kanaExcluded = readProgressListResult(STORAGE_KEYS.KANA_MASTERY_EXCLUDED)
  const vocab = readProgressListResult(STORAGE_KEYS.VOCAB_LEARNED)
  const vocabExcluded = readProgressListResult(STORAGE_KEYS.VOCAB_MASTERY_EXCLUDED)
  const items = readItemProgressMapResult()
  return {
    ok: [kana, kanaExcluded, vocab, vocabExcluded, items].every(result => result.ok),
    ...buildLearningStatusModel({ masteredKanaIds: kana.value, excludedKanaIds: kanaExcluded.value,
      learnedVocabIds: vocab.value, excludedVocabIds: vocabExcluded.value, items: items.value }),
  }
}
