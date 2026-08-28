"use client"

import { ArrowLeft, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { QuizMode } from "@/lib/quiz-generators"
import type { QuizEmptyReason } from "@/lib/quiz-runner-model"
export type { QuizEmptyReason } from "@/lib/quiz-runner-model"

function getQuizEmptyMessage({
  mode,
  reason,
}: {
  mode: QuizMode
  reason: QuizEmptyReason
}) {
  if (reason === "loading") return "加载中..."
  if (reason === "load-error") return "词汇题库加载失败。请重试加载，或稍后再试。"

  if (reason === "filter-empty") {
    if (mode === "hiragana-romaji" || mode === "audio-kana") {
      return "恭喜！你已掌握当前范围内的假名。请取消“只出未掌握”过滤，或切换到其他假名范围。"
    }
    if (mode === "meaning-vocab") {
      return "恭喜！你已掌握当前范围内的词汇。请取消“只出未掌握”过滤，或切换到其他词汇范围。"
    }
  }

  return "当前题库不足以生成 4 个唯一选项。请切换范围、取消筛选，或补充更多学习数据。"
}

export function QuizEmptyState({
  mode,
  onExit,
  onRetryVocabulary,
  reason,
}: {
  mode: QuizMode
  onExit: () => void
  onRetryVocabulary: () => void
  reason: QuizEmptyReason
}) {
  return (
    <div className="container py-20 px-4 mx-auto max-w-lg flex flex-col items-center space-y-6">
      <div className="text-center space-y-4">
        <p className="text-lg text-muted-foreground" data-testid="quiz-empty-state">
          {getQuizEmptyMessage({ mode, reason })}
        </p>
        {mode === "meaning-vocab" && reason === "load-error" ? (
          <Button
            type="button"
            variant="default"
            onClick={onRetryVocabulary}
            className="gap-2"
            data-testid="quiz-retry-vocabulary"
          >
            <RefreshCw className="w-4 h-4" /> 重试加载
          </Button>
        ) : null}
        <Button variant="outline" onClick={onExit} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> 返回选择模式
        </Button>
      </div>
    </div>
  )
}
