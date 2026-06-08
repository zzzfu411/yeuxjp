import type { VocabLevel } from "@/data/vocabulary/types"
import type { VocabularyLevelOption } from "@/components/vocabulary/vocabulary-toolbar"

export const VOCABULARY_LEVELS: readonly VocabularyLevelOption[] = [
  { id: "survival", label: "生存级 (N5)", desc: "购物、问路、自我介绍" },
  { id: "daily", label: "日常级 (N4-N3)", desc: "生活交流、动漫理解" },
  { id: "fluent", label: "流利级 (N2-N1)", desc: "商务、新闻、深层文化" },
] satisfies readonly { id: VocabLevel; label: string; desc: string }[]

export const VOCABULARY_CATEGORY_NAMES: Readonly<Record<string, string>> = {
  greetings: "寒暄 (Greetings)",
  verbs: "动词 (Verbs)",
  adjectives: "形容词 (Adjectives)",
  people: "人物 (People)",
  food: "食物 (Food)",
  time: "时间 (Time)",
  nature: "自然 (Nature)",
  daily: "日用品 (Daily)",
  body: "身体 (Body)",
  directions: "方位 (Directions)",
  transport: "交通 (Transport)",
  colors: "颜色 (Colors)",
  numbers: "数字 (Numbers)",
  furniture: "家居 (Furniture)",
  city: "城市 (City)",
  grammar_words: "虚词 (Grammar Words)",
  abstract: "抽象 (Abstract)",
  society: "社会 (Society)",
  business: "商务 (Business)",
  culture: "文化 (Culture)",
  emotion: "情感 (Emotion)",
}

export function getVocabularyLevelDescription(level: VocabLevel) {
  return VOCABULARY_LEVELS.find((item) => item.id === level)?.desc ?? ""
}
