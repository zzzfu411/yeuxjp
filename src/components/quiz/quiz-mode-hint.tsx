"use client"

import { useMemo } from "react"
import { GlossaryButton, GlossaryTerm } from "@/components/ui/glossary"
import { getNextLesson } from "@/data/lessons"
import { useLearningProfile } from "@/lib/learning-progress"
import { useLearningStatus } from "@/lib/learning-status"
import type { QuizMode } from "@/lib/quiz-generators"
import { verbConjFormsForCourse, VERB_CONJ_FORMS } from "@/lib/verb-conjugation"

export function QuizModeHint({ mode }: { mode: QuizMode }) {
  const learning = useLearningStatus()
  const { profile } = useLearningProfile()
  const nextLesson = useMemo(
    () => getNextLesson(learning.completedLessonIds, profile?.kanaLevel),
    [learning.completedLessonIds, profile?.kanaLevel]
  )
  const includeN4VerbForms = verbConjFormsForCourse(nextLesson?.track, !nextLesson) === VERB_CONJ_FORMS
  let content

  if (mode === "hiragana-romaji") {
    content = (
      <>
        训练：看 <GlossaryTerm termId="kana">假名</GlossaryTerm>，选{" "}
        <GlossaryTerm termId="romaji">罗马音</GlossaryTerm>。建议熟悉后逐步减少罗马音依赖。
      </>
    )
  } else if (mode === "audio-kana") {
    content = (
      <>
        训练：听发音选 <GlossaryTerm termId="kana">假名</GlossaryTerm>。新手建议先从{" "}
        <GlossaryTerm termId="seion">清音</GlossaryTerm> 开始。
      </>
    )
  } else if (mode === "particle") {
    content = (
      <>
        <GlossaryTerm termId="particle">助词</GlossaryTerm>：标记句子成分/关系的小词（は/が/を/に/で/と…）。建议先听整句，再选答案。
      </>
    )
  } else if (mode === "verb-conjugation") {
    content = includeN4VerbForms ? (
      <>
        <GlossaryTerm termId="conjugation">活用</GlossaryTerm>：动词变形练习。本模式会随机抽{" "}
        <GlossaryTerm termId="masu-kei">ます形</GlossaryTerm> / <GlossaryTerm termId="nai-kei">ない形</GlossaryTerm> /{" "}
        <GlossaryTerm termId="te-kei">て形</GlossaryTerm> / <GlossaryTerm termId="ta-kei">た形</GlossaryTerm>，以及 N4 的{" "}
        <GlossaryTerm termId="kanou-kei">可能形</GlossaryTerm> / <GlossaryTerm termId="shieki-kei">使役形</GlossaryTerm>。
      </>
    ) : (
      <>
        <GlossaryTerm termId="conjugation">活用</GlossaryTerm>：动词变形练习。当前课表阶段抽{" "}
        <GlossaryTerm termId="masu-kei">ます形</GlossaryTerm> / <GlossaryTerm termId="nai-kei">ない形</GlossaryTerm> /{" "}
        <GlossaryTerm termId="te-kei">て形</GlossaryTerm> / <GlossaryTerm termId="ta-kei">た形</GlossaryTerm>。进入 N4 后会加入{" "}
        <GlossaryTerm termId="kanou-kei">可能形</GlossaryTerm> / <GlossaryTerm termId="shieki-kei">使役形</GlossaryTerm>。
      </>
    )
  } else if (mode === "audio-sokuon") {
    content = (
      <>
        <GlossaryTerm termId="sokuon">促音</GlossaryTerm>：小「っ/ッ」表示后续子音加倍。专注听是否有“停顿/促住”的感觉。
      </>
    )
  } else if (mode === "audio-longvowel") {
    content = (
      <>
        <GlossaryTerm termId="chouon">长音</GlossaryTerm>：元音拉长可能改变词义。建议反复对比最小对立对（如：ビル/ビール）。
      </>
    )
  } else {
    content = "训练：看单词，选中文意思。建议先从“生存”词表开始，逐步提高难度。"
  }

  return (
    <aside className="w-full border-l-2 border-l-accent/40 bg-primary/5 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
      {content} <GlossaryButton className="ml-2 h-auto px-2 py-1">术语表</GlossaryButton>
    </aside>
  )
}
