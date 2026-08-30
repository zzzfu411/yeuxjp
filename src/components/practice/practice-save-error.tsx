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
      className="ledger-row w-full border border-accent/45 border-l-2 border-l-accent bg-accent/[0.045] p-4 text-sm leading-relaxed text-foreground"
      data-testid="practice-save-error"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
        <div>
          <div className="font-semibold">{title}</div>
          <div className="mt-1 text-muted-foreground">{description}</div>
        </div>
      </div>
    </div>
  )
}
