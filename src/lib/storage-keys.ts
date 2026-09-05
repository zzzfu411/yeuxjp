// 统一的localStorage存储键定义
// 集中管理所有存储键，避免分散定义导致的维护问题

export const STORAGE_KEYS = {
  // 学习进度
  KANA_MASTERED: "yasashi.kana.mastered.v1",
  KANA_MASTERY_EXCLUDED: "yasashi.kana.mastery.excluded.v1",
  VOCAB_LEARNED: "yasashi.vocab.learned.v1",
  VOCAB_MASTERY_EXCLUDED: "yasashi.vocab.mastery.excluded.v1",

  // SRS系统
  SRS_KANA: "yasashi.srs.kana.v1",
  SRS_VOCAB: "yasashi.srs.vocab.v1",
  SRS_MISTAKES: "yasashi.srs.mistakes.v1",

  // 错题本
  MISTAKES: "yasashi.mistakes.v1",

  // 用户偏好
  SPEECH_PREFS: "yasashi.speech.prefs.v1",

  // 学习闭环
  USER_PROFILE: "yasashi.learning.profile.v1",
  LESSON_PROGRESS: "yasashi.learning.lessons.v1",
  ITEM_PROGRESS: "yasashi.learning.items.v1",
  PRACTICE_RESULTS: "yasashi.learning.practice.v1",
  STUDY_CALENDAR: "yasashi.learning.calendar.v1",
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]

// Coordination metadata, deliberately excluded from transferable learning backups.
export const LEARNING_WRITE_EPOCH_KEY = "yasashi.learning.write-epoch.v1"
