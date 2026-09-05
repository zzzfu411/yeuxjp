"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Sparkles } from "lucide-react"
import type { Lesson } from "@/data/lesson-types"
import { loadVocabularyForIds } from "@/data/vocabulary/loader"
import {
  buildLessonCompletionRecapModel,
  lessonRecapVocabWords,
  type LessonRecapVocabWord,
} from "@/lib/lesson-recap-model"
import { useLearningStatus } from "@/lib/learning-status"

export function LessonCompletionRecap({ lesson }: { lesson: Lesson }) {
  const { isVocabLearned, isKanaMastered } = useLearningStatus()
  const recap = buildLessonCompletionRecapModel(lesson, isVocabLearned, isKanaMastered)
  const vocabIdKey = recap.vocabIds.join("\n")
  const [vocabState, setVocabState] = useState<{ key: string; words: LessonRecapVocabWord[] }>({
    key: "",
    words: [],
  })

  useEffect(() => {
    if (!vocabIdKey) return

    let cancelled = false
    loadVocabularyForIds(vocabIdKey.split("\n"))
      .then((items) => {
        if (cancelled) return
        setVocabState({ key: vocabIdKey, words: lessonRecapVocabWords(items) })
      })
      .catch(() => {
        if (cancelled) return
        setVocabState({ key: vocabIdKey, words: [] })
      })

    return () => {
      cancelled = true
    }
  }, [vocabIdKey])

  const vocabWords = vocabState.key === vocabIdKey ? vocabState.words : []

  return (
    <div className="paper-slip relative mt-8 p-5" data-testid="lesson-completed-summary">
      <span className="paper-tape" aria-hidden="true" />
      <div className="flex items-center gap-2 font-semibold">
        <Sparkles className="h-4 w-4" />
        本课完成，练习结果已保存。
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        完成课程和记住词汇是两回事。课后再复习几次，才更容易记牢。
      </p>
      <p className="mt-2 text-sm font-semibold">{recap.summary}</p>
      {recap.highlights.length ? (
        <p className="mt-2 font-jp text-2xl leading-relaxed tracking-widest">{recap.highlights.join(" ")}</p>
      ) : null}
      {vocabWords.length ? (
        <ul className="mt-2 space-y-1 text-sm">
          {vocabWords.map((word) => (
            <li key={word.id} className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-jp font-semibold">{word.label}</span>
              {word.meaning ? <span className="text-muted-foreground">{word.meaning}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
      <Link
        href={recap.href}
        prefetch={false}
        className="mt-3 inline-flex border-b border-accent text-sm font-semibold text-accent"
      >
        {recap.cta}
      </Link>
    </div>
  )
}
