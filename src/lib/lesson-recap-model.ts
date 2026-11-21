import type { Lesson } from "@/data/lesson-types"
import { courseVocabularyHref, getCourseVocabularyIds } from "@/lib/course-vocabulary"
import { getKanaById } from "@/lib/kana-id"
import { courseKanaHref } from "@/lib/course-kana"

export type LessonRecapModel = {
  summary: string
  href: string
  cta: string
  highlights: string[]
  vocabIds: string[]
}

export type LessonRecapVocabWord = {
  id: string
  label: string
  meaning: string
}

export function formatLessonRecapVocabLabel(item: { kanji?: string; kana: string }) {
  const kana = item.kana.trim()
  const kanji = item.kanji?.trim()
  if (kanji && kanji !== kana) return `${kanji}（${kana}）`
  return kana
}

export function lessonRecapVocabWords(
  items: readonly { id?: string; kanji?: string; kana: string; meaning?: string }[]
): LessonRecapVocabWord[] {
  return items
    .map((item) => {
      const label = formatLessonRecapVocabLabel(item)
      return {
        id: item.id?.trim() || label,
        label,
        meaning: item.meaning?.trim() ?? "",
      }
    })
    .filter((item) => item.label)
    .slice(0, 8)
}

function countLessonRecapSentences(lesson: Pick<Lesson, "newItemIds" | "steps">) {
  const ids = new Set<string>()
  for (const item of lesson.newItemIds) {
    if (item.type === "sentence") ids.add(item.id)
  }
  for (const step of lesson.steps) {
    if (step.type === "sentenceBuild") ids.add(step.itemId)
  }
  return ids.size
}

export function lessonRecapVocabLabels(items: readonly { kanji?: string; kana: string }[]): string[] {
  return lessonRecapVocabWords(items).map((item) => item.label)
}

export function buildLessonCompletionRecapModel(
  lesson: Pick<Lesson, "id" | "newItemIds" | "steps">,
  isVocabLearned: (id: string) => boolean,
  isKanaMastered: (id: string) => boolean = () => false
): LessonRecapModel {
  const kanaItems = lesson.newItemIds.filter((item) => item.type === "kana")
  const vocabItems = lesson.newItemIds.filter((item) => item.type === "vocab")
  const vocabIds = getCourseVocabularyIds(lesson)
  const grammarCount = lesson.newItemIds.filter((item) => item.type === "grammar").length
  const sentenceCount = countLessonRecapSentences(lesson)
  const learnedCount = vocabItems.filter((item) => isVocabLearned(item.id)).length
  const kanaMasteredCount = kanaItems.filter((item) => isKanaMastered(item.id)).length
  const parts: string[] = []
  const highlights = kanaItems
    .map((item) => {
      const parsed = getKanaById(item.id)
      return parsed ? parsed.kana[parsed.script] : null
    })
    .filter((value): value is string => Boolean(value))
    .slice(0, 12)

  if (kanaItems.length) parts.push(`假名 ${kanaMasteredCount}/${kanaItems.length}`)
  if (vocabItems.length) parts.push(`本课词汇掌握 ${learnedCount}/${vocabItems.length}`)
  if (grammarCount) parts.push(`语法点 ${grammarCount}`)
  if (sentenceCount) parts.push(`造句 ${sentenceCount}`)

  if (vocabItems.length) {
    return {
      summary: parts.join(" · "),
      href: courseVocabularyHref(lesson),
      cta: "补练本课词汇 →",
      highlights,
      vocabIds,
    }
  }

  if (kanaItems.length) {
    return {
      summary: parts.join(" · ") || `假名 ${kanaMasteredCount}/${kanaItems.length}`,
      href: courseKanaHref(lesson),
      cta: "补练本课假名 →",
      highlights,
      vocabIds,
    }
  }

  if (grammarCount) {
    return {
      summary: sentenceCount
        ? `${parts.join(" · ")}。错题会进复习队列。`
        : `本课语法点 ${grammarCount}。错题会进复习队列。`,
      href: "/review",
      cta: "去复习到期项 →",
      highlights,
      vocabIds,
    }
  }

  return {
    summary: "复习课没有新词。先清空到期队列再继续。",
    href: "/review",
    cta: "去复习到期项 →",
    highlights,
    vocabIds,
  }
}
