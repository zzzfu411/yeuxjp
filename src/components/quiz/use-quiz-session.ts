"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { getNextLesson } from "@/data/lessons"
import { useLearningProfile } from "@/lib/learning-progress"
import { useMistakeNotebook } from "@/lib/mistake-notebook"
import { useLearningStatus } from "@/lib/learning-status"
import type { Question } from "@/lib/questions"
import {
  canStartQuizAnswerSubmission,
  createQuizStats,
  getQuizQuestionKey,
  pickFreshQuizQuestion,
  resolveQuizAnswerSubmission,
  shouldAutoGenerateQuizQuestion,
} from "@/lib/quiz-session"
import { useQuizAudio } from "@/components/quiz/use-quiz-audio"
import { useQuizAnswerRecorder } from "@/components/quiz/use-quiz-answer-recorder"
import { useQuizVocabularyPools } from "@/components/quiz/use-quiz-vocabulary-pools"
import {
  getQuizNoQuestionReason,
  getQuizPreflightEmptyReason,
  shouldKeepCurrentQuizQuestionDuringPreflight,
  type QuizEmptyReason,
} from "@/lib/quiz-runner-model"
import {
  filterUnlearnedVocab,
  filterUnmasteredKana,
  generateQuizQuestion,
  getKanaPool,
  type KanaQuizScope,
  type QuizMode,
  type VocabQuizScope,
} from "@/lib/quiz-generators"

export function useQuizSession(mode: QuizMode) {
  const answerPendingRef = useRef(false)
  const lastQuestionKeyRef = useRef<string | null>(null)
  const selectedOptionRef = useRef<string | null>(null)
  const mistakes = useMistakeNotebook()
  const learning = useLearningStatus()
  const { profile } = useLearningProfile()
  const nextLesson = useMemo(
    () => getNextLesson(learning.completedLessonIds, profile?.kanaLevel),
    [learning.completedLessonIds, profile?.kanaLevel]
  )
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const currentQuestionRef = useRef<Question | null>(null)
  const [emptyReason, setEmptyReason] = useState<QuizEmptyReason>("loading")
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [saveError, setSaveError] = useState(false)
  const [quizStats, setQuizStats] = useState(createQuizStats)
  const [kanaScope, setKanaScope] = useState<KanaQuizScope>("seion")
  const [onlyUnmasteredKana, setOnlyUnmasteredKana] = useState(false)
  const [vocabScope, setVocabScope] = useState<VocabQuizScope>("survival")
  const [onlyUnlearnedVocab, setOnlyUnlearnedVocab] = useState(false)

  const recordAnswer = useQuizAnswerRecorder({
    progress: learning,
    notebook: mistakes,
    setQuizStats,
  })
  const {
    loading: vocabLoading,
    error: vocabError,
    basePool: vocabBasePool,
    retry: retryVocabulary,
  } = useQuizVocabularyPools({ mode, vocabScope })

  const kanaBasePool = useMemo(() => {
    return getKanaPool(kanaScope)
  }, [kanaScope])

  const kanaTargetPool = useMemo(() => {
    return filterUnmasteredKana(kanaBasePool, learning.isKanaMastered, onlyUnmasteredKana)
  }, [learning.isKanaMastered, kanaBasePool, onlyUnmasteredKana])

  const vocabTargetPool = useMemo(() => {
    return filterUnlearnedVocab(vocabBasePool, learning.isVocabLearned, onlyUnlearnedVocab)
  }, [learning.isVocabLearned, onlyUnlearnedVocab, vocabBasePool])

  const { playAudio } = useQuizAudio({
    autoPlayText: currentQuestion?.questionAudio,
    autoPlayKey: currentQuestion,
    autoPlayEnabled: Boolean(currentQuestion?.autoPlayAudio),
  })

  const generateQuestion = useCallback(() => {
    const preflightReason = getQuizPreflightEmptyReason({
      mode,
      vocabLoading,
      vocabError: Boolean(vocabError),
    })
    if (preflightReason) {
      if (shouldKeepCurrentQuizQuestionDuringPreflight({
        hasCurrentQuestion: Boolean(currentQuestionRef.current),
        preflightReason,
      })) {
        return
      }
      currentQuestionRef.current = null
      setCurrentQuestion(null)
      selectedOptionRef.current = null
      setSelectedOption(null)
      answerPendingRef.current = false
      setSaveError(false)
      setEmptyReason(preflightReason)
      return
    }

    const q = pickFreshQuizQuestion(
      () =>
        generateQuizQuestion({
          mode,
          kanaBasePool,
          kanaTargetPool,
          vocabBasePool,
          vocabTargetPool,
          nextTrack: nextLesson?.track,
          allLessonsDone: !nextLesson,
        }),
      lastQuestionKeyRef.current
    )

    if (q) {
      lastQuestionKeyRef.current = getQuizQuestionKey(q)
      currentQuestionRef.current = q
      setCurrentQuestion(q)
      selectedOptionRef.current = null
      setSelectedOption(null)
      answerPendingRef.current = false
      setSaveError(false)
      setEmptyReason("loading")
      return
    }

    currentQuestionRef.current = null
    setCurrentQuestion(null)
    selectedOptionRef.current = null
    setSelectedOption(null)
    answerPendingRef.current = false
    setSaveError(false)
    setEmptyReason(getQuizNoQuestionReason({ mode, onlyUnmasteredKana, onlyUnlearnedVocab }))
  }, [
    kanaBasePool,
    kanaTargetPool,
    mode,
    nextLesson,
    onlyUnlearnedVocab,
    onlyUnmasteredKana,
    vocabBasePool,
    vocabError,
    vocabLoading,
    vocabTargetPool,
  ])

  useEffect(() => {
    if (!shouldAutoGenerateQuizQuestion({
      selectedOption: selectedOptionRef.current,
      answerPending: answerPendingRef.current,
    })) return

    const timer = setTimeout(() => {
      generateQuestion()
    }, 0)
    return () => clearTimeout(timer)
  }, [generateQuestion])

  const handleSelect = useCallback((val: string) => {
    if (!canStartQuizAnswerSubmission({
      selectedOption,
      answerPending: answerPendingRef.current,
      hasQuestion: Boolean(currentQuestion),
    })) return
    if (!currentQuestion) return
    answerPendingRef.current = true

    const result = recordAnswer(currentQuestion, val)
    const submission = resolveQuizAnswerSubmission(val, Boolean(result))
    answerPendingRef.current = submission.answerPending
    selectedOptionRef.current = submission.selectedOption
    setSaveError(submission.saveError)
    setSelectedOption(submission.selectedOption)
  }, [currentQuestion, recordAnswer, selectedOption])

  return {
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
    vocabLoading,
    generateQuestion,
    handleSelect,
    playAudio,
  }
}
