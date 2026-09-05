"use client"

import { useMemo } from "react"
import { GlossaryButton, GlossaryTerm } from "@/components/ui/glossary"
import { getNextLesson } from "@/data/lesson-catalog"
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
        看到 <GlossaryTerm termId="kana">假名</GlossaryTerm> 后，选择对应的{" "}
        <GlossaryTerm termId="romaji">罗马音</GlossaryTerm>。熟悉假名后，可以逐渐少看罗马音。
      </>
    )
  } else if (mode === "audio-kana") {
    content = (
      <>
        听发音，选择对应的 <GlossaryTerm termId="kana">假名</GlossaryTerm>。刚开始可以先练{" "}
        <GlossaryTerm termId="seion">清音</GlossaryTerm>。
      </>
    )
  } else if (mode === "particle") {
    content = (
      <>
        <GlossaryTerm termId="particle">助词</GlossaryTerm>用来标明句子成分之间的关系（は/が/を/に/で/と…）。先听完整句子，再选择答案。
      </>
    )
  } else if (mode === "verb-conjugation") {
    content = includeN4VerbForms ? (
      <>
        这里练习动词 <GlossaryTerm termId="conjugation">活用</GlossaryTerm>。题目会从{" "}
        <GlossaryTerm termId="masu-kei">ます形</GlossaryTerm> / <GlossaryTerm termId="nai-kei">ない形</GlossaryTerm> /{" "}
        <GlossaryTerm termId="te-kei">て形</GlossaryTerm> / <GlossaryTerm termId="ta-kei">た形</GlossaryTerm>，以及 N4 的{" "}
        <GlossaryTerm termId="kanou-kei">可能形</GlossaryTerm> / <GlossaryTerm termId="shieki-kei">使役形</GlossaryTerm>。
      </>
    ) : (
      <>
        这里练习动词 <GlossaryTerm termId="conjugation">活用</GlossaryTerm>。当前课程会从{" "}
        <GlossaryTerm termId="masu-kei">ます形</GlossaryTerm> / <GlossaryTerm termId="nai-kei">ない形</GlossaryTerm> /{" "}
        <GlossaryTerm termId="te-kei">て形</GlossaryTerm> / <GlossaryTerm termId="ta-kei">た形</GlossaryTerm>。进入 N4 后会加入{" "}
        <GlossaryTerm termId="kanou-kei">可能形</GlossaryTerm> / <GlossaryTerm termId="shieki-kei">使役形</GlossaryTerm>。
      </>
    )
  } else if (mode === "audio-sokuon") {
    content = (
      <>
        <GlossaryTerm termId="sokuon">促音</GlossaryTerm>中的小「っ/ッ」本身不发音。请留意后面的辅音前有没有短暂停顿。
      </>
    )
  } else if (mode === "audio-longvowel") {
    content = (
      <>
        <GlossaryTerm termId="chouon">长音</GlossaryTerm>会把元音拉长，有时也会改变词义。可以反复比较发音只差长短的一组词（如：ビル/ビール）。
      </>
    )
  } else {
    content = "看到单词后，选择对应的中文意思。可以先从入门词汇开始，再逐步提高难度。"
  }

  return (
    <aside className="w-full border-l-2 border-l-accent/40 bg-primary/5 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
      {content} <GlossaryButton className="ml-2 h-auto px-2 py-1">术语表</GlossaryButton>
    </aside>
  )
}
