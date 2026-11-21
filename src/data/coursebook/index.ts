import type { ChoiceStep, Lesson, LessonStep } from "../lesson-types"
import { kanaData } from "../kana-data"
import { grammarData } from "../grammar-data"
import { survivalVocab } from "../vocabulary/survival"
import { dailyVocab } from "../vocabulary/daily"
import { fluentVocab } from "../vocabulary/fluent"
import { N5_UNITS } from "./n5"
import { N4_UNITS } from "./n4"
import { N3_UNITS } from "./n3"
import { N2_UNITS } from "./n2"
import type { StudyWord } from "./types"

export const COURSE_UNITS = [...N5_UNITS, ...N4_UNITS, ...N3_UNITS, ...N2_UNITS]
const vocabulary = new Map([...survivalVocab, ...dailyVocab, ...fluentVocab].map(word => [word.id, word]))
const grammar = new Map(Object.values(grammarData).flat().map(point => [point.id, point]))

function explainChoice(step: ChoiceStep, lesson: Lesson, focus: string) {
  if (step.explanation) return step.explanation.length >= 20 ? step.explanation : `${step.explanation} ${focus}`
  if (step.itemType === "kana") {
    const [script, sound] = step.itemId.split(":")
    const kana = kanaData.find(item => item.romaji === sound)
    if (kana) {
      const symbol = script === "katakana" ? kana.katakana : kana.hiragana
      const detail = kana.type === "yoon" ? "小写ゃ・ゅ・ょ与前一个字合为一拍，要与两个大字的两拍读法区分。" : kana.type === "dakuon" ? "留意右上角浊点，不能读成对应的清音。" : kana.type === "handakuon" ? "右上角的小圆圈表示半浊音，は行在这里读p开头。" : "先听清开头与元音，再对照字形；罗马字用于辅助识别，发音以日语声音为准。"
      return `${symbol} 对应 ${kana.romaji}；本题应选「${step.answer}」。${detail}`
    }
    return `本题应选「${step.answer}」。${focus}`
  }
  const word = vocabulary.get(step.itemId)
  if (step.itemType === "vocab" && word) {
    const example = word.exampleSentences?.[0]
    return `「${word.kanji ?? word.kana}」（${word.kana}）表示${word.meaning}。本题对应「${step.answer}」。${example ? `语境例句：${example.japanese}（${example.meaning}）` : focus}`
  }
  const point = grammar.get(step.itemId) ?? lesson.newItemIds.map(item => grammar.get(item.id)).find(Boolean)
  return `本题应选「${step.answer}」。${point ? `相关结构：${point.structure}。${point.plainExplanation ?? point.explanation} ` : ""}${focus}`
}

export function enrichCourseLessons(lessons: Lesson[]): Lesson[] {
  return lessons.map(lesson => {
    const unitIndex = Math.floor((lesson.order - 1) / 5)
    const unit = COURSE_UNITS[unitIndex]
    if (!unit || lesson.order < unit.start || lesson.order >= unit.start + 5) throw new Error(`Missing course unit: ${lesson.id}`)
    const offset = lesson.order - unit.start
    const [goal, explanation, task, model] = unit.focuses[offset]
    const [prompt, answer, distractorA, distractorB, rationale] = unit.checks[offset]
    const listening = lesson.order % 2 === 0
    const comprehension: ChoiceStep = {
      id: `coursebook-${lesson.order}-comprehension-v1`, type: "multipleChoice",
      title: listening ? "情境听解：抓住关键信息" : "阅读理解：找到原文依据",
      prompt, answer, options: [answer, distractorA, distractorB], explanation: rationale,
      ...(listening ? { audioText: unit.reading } : { passage: unit.reading }),
      itemId: `sentence-coursebook-${lesson.order}-comprehension`, itemType: "sentence", mode: listening ? "listening" : "meaning",
    }
    const words: StudyWord[] = [...unit.words]
    for (const ref of lesson.newItemIds) {
      const word = ref.type === "vocab" ? vocabulary.get(ref.id) : undefined
      if (word && !words.some(entry => entry[0] === (word.kanji ?? word.kana))) words.push([word.kanji ?? word.kana, word.kana, word.meaning])
    }
    const steps: LessonStep[] = lesson.steps.map(step => {
      if (step.type === "multipleChoice") return { ...step, explanation: explainChoice(step, lesson, explanation) }
      if (step.type === "summary") return { ...step, title: "本课回顾与表达", body: `本课目标：${goal}。完成下方表达任务，检查自己能否在新情境中使用。`, next: "可分次学习。明天先尝试回忆本课表达，再继续下一课。" }
      return step
    })
    const summaryIndex = steps.findIndex(step => step.type === "summary")
    steps.splice(summaryIndex < 0 ? steps.length : summaryIndex, 0, comprehension)
    return {
      ...lesson,
      title: lesson.title.replace(/^Day (\d+)：/, "第 $1 课："),
      subtitle: goal,
      unit: { number: unitIndex + 1, title: unit.title },
      estimatedMinutes: lesson.order <= 45 ? 25 : lesson.order <= 90 ? 30 : lesson.order <= 135 ? 35 : 40,
      steps,
      study: { unitNumber: unitIndex + 1, unitTitle: unit.title, goal, explanation, scene: unit.scene,
        dialogue: unit.dialogue, readingTitle: unit.readingTitle, reading: unit.reading, translation: unit.translation,
        words, task, model,
        reviewLessonIds: [lesson.order - 1, lesson.order - 5].filter(order => order > 0).map(order => lessons.find(item => item.order === order)!.id),
      },
    }
  })
}
