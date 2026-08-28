"use client"

import { AlertTriangle } from "lucide-react"

export function PracticeSaveError({
  show,
  title = "本次答案没有保存成功",
  description = "请检查浏览器存储权限或剩余空间，然后再试一次。",
}: {
  show: boolean
  title?: string
  description?: string
}) {
  if (!show) return null

  return (
    <div
      role="alert"
      className="hard-panel w-full border-foreground bg-amber-50 p-4 text-sm leading-relaxed text-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
      data-testid="practice-save-error"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <div className="font-semibold">{title}</div>
          <div className="mt-1 text-amber-800 dark:text-amber-100/80">{description}</div>
        </div>
      </div>
    </div>
  )
}
