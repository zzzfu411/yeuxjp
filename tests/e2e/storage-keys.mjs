export const E2E_STORAGE_KEYS = {
  KANA_MASTERED: "yasashi.kana.mastered.v1",
  KANA_MASTERY_EXCLUDED: "yasashi.kana.mastery.excluded.v1",
  VOCAB_LEARNED: "yasashi.vocab.learned.v1",
  VOCAB_MASTERY_EXCLUDED: "yasashi.vocab.mastery.excluded.v1",
  SRS_KANA: "yasashi.srs.kana.v1",
  SRS_VOCAB: "yasashi.srs.vocab.v1",
  SRS_MISTAKES: "yasashi.srs.mistakes.v1",
  MISTAKES: "yasashi.mistakes.v1",
  SPEECH_PREFS: "yasashi.speech.prefs.v1",
  USER_PROFILE: "yasashi.learning.profile.v1",
  LESSON_PROGRESS: "yasashi.learning.lessons.v1",
  ITEM_PROGRESS: "yasashi.learning.items.v1",
  PRACTICE_RESULTS: "yasashi.learning.practice.v1",
}

export const managedLearningBackupKeys = Object.values(E2E_STORAGE_KEYS)
export const E2E_LEARNING_BACKUP_VERSION = 3
