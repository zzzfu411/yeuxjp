"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, ArrowLeft } from "lucide-react"
import { speakJapaneseRepeated } from "@/lib/speech"
import { useKanaProgress } from "@/lib/kana-progress"
import { useVocabProgress } from "@/lib/vocab-progress"
import { useMistakeNotebook } from "@/lib/mistake-notebook"
import { useLearningProgress } from "@/lib/learning-progress"
import type { Question } from "@/lib/questions"
import { createQuizStats } from "@/lib/quiz-session"
import { SpeechSettingsBar, useSpeechPreferences } from "@/components/ui/speech-preferences"
import { QuizAnswerFeedback } from "@/components/quiz/quiz-answer-feedback"
import { QuizModeHint } from "@/components/quiz/quiz-mode-hint"
import { QuizOptionGrid } from "@/components/quiz/quiz-option-grid"
import { QuizQuestionPrompt } from "@/components/quiz/quiz-question-prompt"
import { QuizScopeControls } from "@/components/quiz/quiz-scope-controls"
import { useQuizAnswerRecorder } from "@/components/quiz/use-quiz-answer-recorder"
import { useQuizVocabularyPools } from "@/components/quiz/use-quiz-vocabulary-pools"
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

  const { isMastered: isKanaMastered } = useKanaProgress()
  const { isLearnedId } = useVocabProgress()
  const recordAnswer = useQuizAnswerRecorder({
    progress,
    notebook: mistakes,
    setQuizStats,
  })
  const {
    loading: vocabLoading,
    basePool: vocabBasePool,
    fallbackPool: allVocab,
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
    if (!currentQuestion) return

    const result = recordAnswer(currentQuestion, val)
    if (!result) return
    setSelectedOption(val)
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
