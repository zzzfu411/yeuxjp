"use client"

import * as React from "react"
import { Download, RotateCcw, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  createLearningBackup,
  parseLearningBackup,
  restoreLearningBackup,
  resetLearningData,
} from "@/lib/learning-store"
import { cn } from "@/lib/utils"

type Notice = {
  tone: "success" | "error"
  text: string
}

function backupFileName(exportedAt: number) {
  return `yasashi-learning-backup-${new Date(exportedAt).toISOString().slice(0, 10)}.json`
}

export function LearningDataPanel({ className }: { className?: string }) {
  const fileRef = React.useRef<HTMLInputElement | null>(null)
  const [notice, setNotice] = React.useState<Notice | null>(null)
  const [confirmReset, setConfirmReset] = React.useState(false)

  const exportData = React.useCallback(() => {
    const backup = createLearningBackup()
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = backupFileName(backup.exportedAt)
    anchor.click()
    URL.revokeObjectURL(url)
    setNotice({ tone: "success", text: "备份已生成。" })
    setConfirmReset(false)
  }, [])

  const importData = React.useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const backup = parseLearningBackup(String(reader.result ?? ""))
      if (!backup) {
        setNotice({ tone: "error", text: "备份文件无法读取。" })
        return
      }

      if (!restoreLearningBackup(backup)) {
        setNotice({ tone: "error", text: "导入失败。" })
        return
      }

      setNotice({ tone: "success", text: "学习数据已恢复。" })
      setConfirmReset(false)
    }
    reader.onerror = () => setNotice({ tone: "error", text: "备份文件无法读取。" })
    reader.readAsText(file)
  }, [])

  const resetData = React.useCallback(() => {
    if (!confirmReset) {
      setConfirmReset(true)
      setNotice({ tone: "error", text: "再次点击清空本地数据。" })
      return
    }

    if (resetLearningData()) {
      setNotice({ tone: "success", text: "本地学习数据已清空。" })
      setConfirmReset(false)
      return
    }

    setNotice({ tone: "error", text: "清空失败。" })
  }, [confirmReset])

  return (
    <section className={cn("rounded-2xl border bg-card p-5 shadow-sm", className)} data-testid="learning-data-panel">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="text-sm font-semibold text-foreground">本地学习数据</div>
          <div className="text-xs text-muted-foreground">进度、SRS、错题本和朗读偏好只保存在这台设备。</div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" className="gap-1.5 rounded-full" onClick={exportData} data-testid="learning-data-export">
            <Download className="h-3.5 w-3.5" />
            导出
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-full"
            onClick={() => fileRef.current?.click()}
            data-testid="learning-data-import"
          >
            <Upload className="h-3.5 w-3.5" />
            导入
          </Button>
          <Button
            type="button"
            variant={confirmReset ? "destructive" : "ghost"}
            size="sm"
            className="gap-1.5 rounded-full"
            onClick={resetData}
            data-testid="learning-data-reset"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            清空
          </Button>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        data-testid="learning-data-file"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0]
          event.currentTarget.value = ""
          if (file) importData(file)
        }}
      />

      {notice ? (
        <div
          className={cn(
            "mt-4 rounded-xl border px-3 py-2 text-xs",
            notice.tone === "success"
              ? "border-green-200 bg-green-50 text-green-800 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-200"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          )}
          role="status"
        >
          {notice.text}
        </div>
      ) : null}
    </section>
  )
}
