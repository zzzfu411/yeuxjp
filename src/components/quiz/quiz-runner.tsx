"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { loadVocabularyScope } from "@/data/vocabulary/loader"
import type { Vocabulary } from "@/data/vocabulary/types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { RefreshCw, ArrowLeft } from "lucide-react"
import { speakJapaneseRepeated } from "@/lib/speech"
import { useKanaProgress } from "@/lib/kana-progress"
import { useVocabProgress } from "@/lib/vocab-progress"
import { useMistakeNotebook } from "@/lib/mistake-notebook"
import { useLearningProgress } from "@/lib/learning-progress"
import { recordQuestionPractice } from "@/lib/learning-session"
import { makeQuestionResult, type Question } from "@/lib/questions"
import { createQuizStats, recordQuizAnswer } from "@/lib/quiz-session"
import { GlossaryButton, GlossaryTerm } from "@/components/ui/glossary"
import { SpeechSettingsBar, useSpeechPreferences } from "@/components/ui/speech-preferences"
import { QuizAnswerFeedback } from "@/components/quiz/quiz-answer-feedback"
import { QuizOptionGrid } from "@/components/quiz/quiz-option-grid"
import { QuizQuestionPrompt } from "@/components/quiz/quiz-question-prompt"
import {
  filterUnlearnedVocab,
  filterUnmasteredKana,
  generateQuizQuestion,
  getKanaPool,
  type KanaQuizScope,
  type QuizMode,
  type VocabQuizScope,
} from "@/lib/quiz-generators"

export function QuizRunner({ mode, onExit }: { mode: QuizMode, onExit: () => void }) {
  const speech = useSpeechPreferences()
  const mistakes = useMistakeNotebook()
  const progress = useLearningProgress()
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [quizStats, setQuizStats] = useState(createQuizStats)
  const [kanaScope, setKanaScope] = useState<KanaQuizScope>("seion")
  const [onlyUnmasteredKana, setOnlyUnmasteredKana] = useState(false)
  const [vocabScope, setVocabScope] = useState<VocabQuizScope>("survival")
  const [onlyUnlearnedVocab, setOnlyUnlearnedVocab] = useState(false)
  const [vocabPools, setVocabPools] = useState<{
    scope: VocabQuizScope | null
    base: Vocabulary[]
    fallback: Vocabulary[]
    error: string | null
  }>({
    scope: null,
    base: [],
    fallback: [],
    error: null,
  })

  const { isMastered: isKanaMastered } = useKanaProgress()
  const { isLearnedId } = useVocabProgress()

  const kanaBasePool = useMemo(() => {
    return getKanaPool(kanaScope)
  }, [kanaScope])

  const kanaTargetPool = useMemo(() => {
    return filterUnmasteredKana(kanaBasePool, isKanaMastered, onlyUnmasteredKana)
  }, [isKanaMastered, kanaBasePool, onlyUnmasteredKana])

  useEffect(() => {
    if (mode !== "meaning-vocab") return
    let cancelled = false

    ;(async () => {
      const base = await loadVocabularyScope(vocabScope)
      const fallback = base.length >= 4 ? base : await loadVocabularyScope("all")
      if (cancelled) return
      setVocabPools({
        scope: vocabScope,
        base,
        fallback,
        error: null,
      })
    })().catch(() => {
      if (cancelled) return
      setVocabPools({
        scope: vocabScope,
        base: [],
        fallback: [],
        error: "Failed to load vocabulary",
      })
    })

    return () => {
      cancelled = true
    }
  }, [mode, vocabScope])

  const vocabLoading = mode === "meaning-vocab" && vocabPools.scope !== vocabScope

  const vocabBasePool = useMemo(() => {
    return !vocabLoading ? vocabPools.base : []
  }, [vocabLoading, vocabPools.base])

  const allVocab = useMemo(() => {
    return !vocabLoading ? vocabPools.fallback : []
  }, [vocabLoading, vocabPools.fallback])

  const vocabTargetPool = useMemo(() => {
    return filterUnlearnedVocab(vocabBasePool, isLearnedId, onlyUnlearnedVocab)
  }, [isLearnedId, onlyUnlearnedVocab, vocabBasePool])

  const playAudio = useCallback((text: string) => {
    const repeat = speech?.prefs.repeat ?? 1
    const gapMs = speech?.prefs.gapMs ?? 250
    speakJapaneseRepeated(text, { repeat, gapMs })
  }, [speech?.prefs.gapMs, speech?.prefs.repeat])

  const modeHint = useMemo(() => {
    if (mode === "hiragana-romaji") {
      return (
        <>
          训练：看 <GlossaryTerm termId="kana">假名</GlossaryTerm>，选{" "}
          <GlossaryTerm termId="romaji">罗马音</GlossaryTerm>。建议熟悉后逐步减少罗马音依赖。
        </>
      )
    }
    if (mode === "audio-kana") {
      return (
        <>
          训练：听发音选 <GlossaryTerm termId="kana">假名</GlossaryTerm>。新手建议先从{" "}
          <GlossaryTerm termId="seion">清音</GlossaryTerm> 开始。
        </>
      )
    }
    if (mode === "particle") {
      return (
        <>
          <GlossaryTerm termId="particle">助词</GlossaryTerm>：标记句子成分/关系的小词（は/が/を/に/で/と…）。建议先听整句，再选答案。
        </>
      )
    }
    if (mode === "verb-conjugation") {
      return (
        <>
          <GlossaryTerm termId="conjugation">活用</GlossaryTerm>：动词变形练习。本模式会随机抽{" "}
          <GlossaryTerm termId="masu-kei">ます形</GlossaryTerm> / <GlossaryTerm termId="nai-kei">ない形</GlossaryTerm> /{" "}
          <GlossaryTerm termId="te-kei">て形</GlossaryTerm> / <GlossaryTerm termId="ta-kei">た形</GlossaryTerm>。
        </>
      )
    }
    if (mode === "audio-sokuon") {
      return (
        <>
          <GlossaryTerm termId="sokuon">促音</GlossaryTerm>：小「っ/ッ」表示后续子音加倍。专注听是否有“停顿/促住”的感觉。
        </>
      )
    }
    if (mode === "audio-longvowel") {
      return (
        <>
          <GlossaryTerm termId="chouon">长音</GlossaryTerm>：元音拉长可能改变词义。建议反复对比最小对立对（如：ビル/ビール）。
        </>
      )
    }
    return "训练：看单词，选中文意思。建议先从“生存”词表开始，逐步提高难度。"
  }, [mode])

  const generateQuestion = useCallback(() => {
    if (mode === "meaning-vocab" && (vocabLoading || vocabBasePool.length === 0)) {
      setCurrentQuestion(null)
      setSelectedOption(null)
      return
    }

    const q = generateQuizQuestion({
      mode,
      kanaBasePool,
      kanaTargetPool,
      vocabBasePool,
      vocabTargetPool,
      allVocab,
    })

    if (q) {
      setCurrentQuestion(q)
      setSelectedOption(null)
      
      // Auto-play audio if in audio mode
      const autoPlay = speech?.prefs.autoPlay ?? true
      if (q.questionAudio && q.autoPlayAudio && autoPlay) {
        setTimeout(() => playAudio(q.questionAudio!), 500)
      }
    }
  }, [allVocab, kanaBasePool, kanaTargetPool, mode, playAudio, speech?.prefs.autoPlay, vocabBasePool, vocabLoading, vocabTargetPool])

  // Initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      generateQuestion()
    }, 0)
    return () => clearTimeout(timer)
  }, [generateQuestion])

  const handleSelect = (val: string) => {
    if (selectedOption) return
    setSelectedOption(val)

    if (currentQuestion) {
      const result = makeQuestionResult(currentQuestion, val)
      setQuizStats((prev) => recordQuizAnswer(prev, result.correct))
      recordQuestionPractice({ progress, notebook: mistakes, result })
    }
  }

  if (!currentQuestion) {
    return (
      <div className="container py-20 px-4 mx-auto max-w-lg flex flex-col items-center space-y-6">
        <div className="text-center space-y-4">
          <p className="text-lg text-muted-foreground">
            {(mode === 'hiragana-romaji' || mode === 'audio-kana') && onlyUnmasteredKana
              ? "恭喜！你已掌握所有假名。请取消「只出未掌握」过滤，或返回选择其他模式。"
              : mode === 'meaning-vocab' && onlyUnlearnedVocab
              ? "恭喜！你已掌握所有词汇。请取消「只出未掌握」过滤，或返回选择其他模式。"
              : "加载中..."}
          </p>
          <Button variant="outline" onClick={onExit} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> 返回选择模式
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-10 px-4 mx-auto max-w-lg flex flex-col items-center space-y-6 mb-20">
      {/* Header */}
      <div className="w-full flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onExit} className="gap-2 text-muted-foreground">
          <ArrowLeft className="w-4 h-4" /> 退出
        </Button>
        <div className="font-mono font-medium">
          得分: {quizStats.score}/{quizStats.total}
        </div>
      </div>

      <div className="w-full rounded-xl border bg-muted/10 p-4 text-sm text-muted-foreground leading-relaxed">
        {modeHint} <GlossaryButton className="ml-2 h-auto px-2 py-1 rounded-md">术语表</GlossaryButton>
      </div>

      <SpeechSettingsBar
        showQuizOptions={
          mode === "audio-kana" || mode === "audio-sokuon" || mode === "audio-longvowel" || mode === "particle"
        }
      />

      {/* Scopes / review filters */}
      {(mode === "hiragana-romaji" || mode === "audio-kana") && (
        <div className="w-full flex flex-wrap items-center justify-center gap-2">
          <div className="flex p-1 bg-secondary rounded-lg">
            <button
              onClick={() => setKanaScope("seion")}
              className={cn(
                "px-5 py-2 rounded-md text-sm font-medium transition-all",
                kanaScope === "seion"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              清音
            </button>
            <button
              onClick={() => setKanaScope("all")}
              className={cn(
                "px-5 py-2 rounded-md text-sm font-medium transition-all",
                kanaScope === "all"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              全部
            </button>
          </div>

          <button
            onClick={() => setOnlyUnmasteredKana((v) => !v)}
            className={cn(
              "px-4 py-2 rounded-full border transition-colors bg-background hover:bg-secondary/60 text-sm",
              onlyUnmasteredKana && "border-primary/40 bg-primary/5"
            )}
          >
            {onlyUnmasteredKana ? "只出未掌握" : "全部出题"}
          </button>
        </div>
      )}

      {mode === "meaning-vocab" && (
        <div className="w-full flex flex-wrap items-center justify-center gap-2">
          <div className="flex flex-wrap p-1 bg-secondary rounded-lg">
            <button
              onClick={() => setVocabScope("survival")}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-all",
                vocabScope === "survival"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              生存
            </button>
            <button
              onClick={() => setVocabScope("daily")}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-all",
                vocabScope === "daily"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              日常
            </button>
            <button
              onClick={() => setVocabScope("fluent")}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-all",
                vocabScope === "fluent"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              流利
            </button>
            <button
              onClick={() => setVocabScope("all")}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-all",
                vocabScope === "all"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              全部
            </button>
          </div>

          <button
            onClick={() => setOnlyUnlearnedVocab((v) => !v)}
            className={cn(
              "px-4 py-2 rounded-full border transition-colors bg-background hover:bg-secondary/60 text-sm",
              onlyUnlearnedVocab && "border-primary/40 bg-primary/5"
            )}
          >
            {onlyUnlearnedVocab ? "只出未掌握" : "全部出题"}
          </button>
        </div>
      )}

      <QuizQuestionPrompt
        question={currentQuestion}
        mode={mode}
        onPlayAudio={playAudio}
      />

      <QuizOptionGrid
        question={currentQuestion}
        selectedOption={selectedOption}
        onSelect={handleSelect}
      />

      <QuizAnswerFeedback
        question={currentQuestion}
        mode={mode}
        selectedOption={selectedOption}
      />

      {/* Next Button */}
      {selectedOption && (
        <Button onClick={generateQuestion} size="lg" className="w-full gap-2 animate-in fade-in slide-in-from-bottom-2">
          下一题 <RefreshCw className="w-4 h-4" />
        </Button>
      )}
    </div>
  )
}
