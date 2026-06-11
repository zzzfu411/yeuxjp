"use client"

import { ArrowLeft, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SpeechSettingsBar } from "@/components/ui/speech-preferences"
import { QuizAnswerFeedback } from "@/components/quiz/quiz-answer-feedback"
import { QuizEmptyState } from "@/components/quiz/quiz-empty-state"
import { QuizModeHint } from "@/components/quiz/quiz-mode-hint"
import { QuizOptionGrid } from "@/components/quiz/quiz-option-grid"
import { QuizQuestionPrompt } from "@/components/quiz/quiz-question-prompt"
import { QuizScopeControls } from "@/components/quiz/quiz-scope-controls"
import { PracticeSaveError } from "@/components/practice/practice-save-error"
import { useQuizSession } from "@/components/quiz/use-quiz-session"
import { shouldShowQuizSpeechOptions } from "@/lib/quiz-runner-model"
import type { QuizMode } from "@/lib/quiz-generators"

export function QuizRunner({ mode, onExit }: { mode: QuizMode, onExit: () => void }) {
  const {
    currentQuestion,
    emptyReason,
    selectedOption,
    saveError,
    quizStats,
    kanaScope,
    setKanaScope,
    onlyUnmasteredKana,
    setOnlyUnmasteredKana,
    vocabScope,
    setVocabScope,
    onlyUnlearnedVocab,
    setOnlyUnlearnedVocab,
    retryVocabulary,
    generateQuestion,
    handleSelect,
    playAudio,
  } = useQuizSession(mode)

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
        showQuizOptions={shouldShowQuizSpeechOptions(mode)}
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
