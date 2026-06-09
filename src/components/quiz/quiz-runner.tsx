"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowLeft, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { speakJapaneseRepeated } from "@/lib/speech"
import { useKanaProgress } from "@/lib/kana-progress"
import { useVocabProgress } from "@/lib/vocab-progress"
import { useMistakeNotebook } from "@/lib/mistake-notebook"
import { useLearningProgress } from "@/lib/learning-progress"
import type { Question } from "@/lib/questions"
import { createQuizStats } from "@/lib/quiz-session"
import { SpeechSettingsBar, useSpeechPreferences } from "@/components/ui/speech-preferences"
import { QuizAnswerFeedback } from "@/components/quiz/quiz-answer-feedback"
import { QuizEmptyState, type QuizEmptyReason } from "@/components/quiz/quiz-empty-state"
import { QuizModeHint } from "@/components/quiz/quiz-mode-hint"
import { QuizOptionGrid } from "@/components/quiz/quiz-option-grid"
import { QuizQuestionPrompt } from "@/components/quiz/quiz-question-prompt"
import { QuizScopeControls } from "@/components/quiz/quiz-scope-controls"
import { useQuizAnswerRecorder } from "@/components/quiz/use-quiz-answer-recorder"
import { useQuizVocabularyPools } from "@/components/quiz/use-quiz-vocabulary-pools"
import { PracticeSaveError } from "@/components/practice/practice-save-error"
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
  const [emptyReason, setEmptyReason] = useState<QuizEmptyReason>("loading")
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [saveError, setSaveError] = useState(false)
  const [quizStats, setQuizStats] = useState(createQuizStats)
  const [kanaScope, setKanaScope] = useState<KanaQuizScope>("seion")
  const [onlyUnmasteredKana, setOnlyUnmasteredKana] = useState(false)
  const [vocabScope, setVocabScope] = useState<VocabQuizScope>("survival")
  const [onlyUnlearnedVocab, setOnlyUnlearnedVocab] = useState(false)

  const { isMastered: isKanaMastered } = useKanaProgress()
  const { isLearnedId } = useVocabProgress()
  const recordAnswer = useQuizAnswerRecorder({
    progress,
    notebook: mistakes,
    setQuizStats,
  })
  const {
    loading: vocabLoading,
    error: vocabError,
    basePool: vocabBasePool,
    fallbackPool: allVocab,
    retry: retryVocabulary,
  } = useQuizVocabularyPools({ mode, vocabScope })

  const kanaBasePool = useMemo(() => {
    return getKanaPool(kanaScope)
  }, [kanaScope])

  const kanaTargetPool = useMemo(() => {
    return filterUnmasteredKana(kanaBasePool, isKanaMastered, onlyUnmasteredKana)
  }, [isKanaMastered, kanaBasePool, onlyUnmasteredKana])

  const vocabTargetPool = useMemo(() => {
    return filterUnlearnedVocab(vocabBasePool, isLearnedId, onlyUnlearnedVocab)
  }, [isLearnedId, onlyUnlearnedVocab, vocabBasePool])

  const playAudio = useCallback((text: string) => {
    const repeat = speech?.prefs.repeat ?? 1
    const gapMs = speech?.prefs.gapMs ?? 250
    speakJapaneseRepeated(text, { repeat, gapMs })
  }, [speech?.prefs.gapMs, speech?.prefs.repeat])

  const generateQuestion = useCallback(() => {
    if (mode === "meaning-vocab" && vocabError) {
      setCurrentQuestion(null)
      setSelectedOption(null)
      setSaveError(false)
      setEmptyReason("load-error")
      return
    }

    if (mode === "meaning-vocab" && vocabLoading) {
      setCurrentQuestion(null)
      setSelectedOption(null)
      setSaveError(false)
      setEmptyReason("loading")
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
      setSaveError(false)
      setEmptyReason("loading")

      const autoPlay = speech?.prefs.autoPlay ?? true
      if (q.questionAudio && q.autoPlayAudio && autoPlay) {
        setTimeout(() => playAudio(q.questionAudio!), 500)
      }
      return
    }

    setCurrentQuestion(null)
    setSelectedOption(null)
    setSaveError(false)
    setEmptyReason(
      ((mode === "hiragana-romaji" || mode === "audio-kana") && onlyUnmasteredKana) ||
        (mode === "meaning-vocab" && onlyUnlearnedVocab)
        ? "filter-empty"
        : "pool-too-small"
    )
  }, [
    allVocab,
    kanaBasePool,
    kanaTargetPool,
    mode,
    onlyUnlearnedVocab,
    onlyUnmasteredKana,
    playAudio,
    speech?.prefs.autoPlay,
    vocabBasePool,
    vocabError,
    vocabLoading,
    vocabTargetPool,
  ])

  useEffect(() => {
    const timer = setTimeout(() => {
      generateQuestion()
    }, 0)
    return () => clearTimeout(timer)
  }, [generateQuestion])

  const handleSelect = (val: string) => {
    if (selectedOption) return
    if (!currentQuestion) return

    const result = recordAnswer(currentQuestion, val)
    if (!result) {
      setSaveError(true)
      return
    }
    setSaveError(false)
    setSelectedOption(val)
  }

  if (!currentQuestion) {
    return (
      <QuizEmptyState
        mode={mode}
        onExit={onExit}
        onRetryVocabulary={retryVocabulary}
        reason={emptyReason}
      />
    )
  }

  return (
    <div className="container py-10 px-4 mx-auto max-w-lg flex flex-col items-center space-y-6 mb-20">
      <div className="w-full flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onExit} className="gap-2 text-muted-foreground">
          <ArrowLeft className="w-4 h-4" /> 退出
        </Button>
        <div className="font-mono font-medium">
          得分: {quizStats.score}/{quizStats.total}
        </div>
      </div>

      <QuizModeHint mode={mode} />

      <SpeechSettingsBar
        showQuizOptions={
          mode === "audio-kana" || mode === "audio-sokuon" || mode === "audio-longvowel" || mode === "particle"
        }
      />

      <QuizScopeControls
        mode={mode}
        kanaScope={kanaScope}
        onKanaScopeChange={setKanaScope}
        onlyUnmasteredKana={onlyUnmasteredKana}
        onOnlyUnmasteredKanaChange={setOnlyUnmasteredKana}
        vocabScope={vocabScope}
        onVocabScopeChange={setVocabScope}
        onlyUnlearnedVocab={onlyUnlearnedVocab}
        onOnlyUnlearnedVocabChange={setOnlyUnlearnedVocab}
      />

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

      <PracticeSaveError show={saveError} />

      <QuizAnswerFeedback
        question={currentQuestion}
        mode={mode}
        selectedOption={selectedOption}
      />

      {selectedOption && (
        <Button onClick={generateQuestion} size="lg" className="w-full gap-2 animate-in fade-in slide-in-from-bottom-2">
          下一题 <RefreshCw className="w-4 h-4" />
        </Button>
      )}
    </div>
  )
}
