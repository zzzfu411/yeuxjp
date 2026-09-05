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
      return "恭喜！你已掌握当前范围内的假名。请关闭“只出未掌握”，或切换到其他假名范围。"
    }
    if (mode === "meaning-vocab") {
      return "恭喜！你已掌握当前范围内的词汇。请关闭“只出未掌握”，或切换到其他词汇范围。"
    }
  }

  return "当前范围内的题目太少，无法生成 4 个不同选项。请扩大范围或取消筛选。"
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
      <div className="paper-slip space-y-4 px-6 py-8 text-center">
        <div className="eyebrow">暂无可用题目</div>
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
