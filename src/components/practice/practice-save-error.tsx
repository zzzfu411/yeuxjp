"use client"

import { AlertTriangle } from "lucide-react"

export function PracticeSaveError({ show }: { show: boolean }) {
  if (!show) return null

  return (
    <div
      role="alert"
      className="w-full rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"
      data-testid="practice-save-error"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <div className="font-semibold">本次答案没有保存成功</div>
          <div className="mt-1 text-amber-800 dark:text-amber-100/80">
            请检查浏览器存储权限或剩余空间，然后再试一次。
          </div>
        </div>
      </div>
    </div>
  )
}
