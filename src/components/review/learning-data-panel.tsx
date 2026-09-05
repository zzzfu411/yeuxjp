"use client"

import { runLearningWrite } from "@/lib/learning-write-lock"

import * as React from "react"
import { Download, RotateCcw, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog"
import {
  parseLearningBackup,
  restoreLearningBackup,
  resetLearningData,
  tryCreateLearningBackup,
  type LearningBackup,
} from "@/lib/learning-store"
import { cn } from "@/lib/utils"

type Notice = {
  tone: "success" | "error"
  text: string
}

const LEARNING_BACKUP_FILE_MAX_BYTES = 2 * 1024 * 1024

function backupFileName(exportedAt: number) {
  const stamp = new Date(exportedAt).toISOString().slice(0, 19).replace(/:/g, "-").replace("T", "-")
  return `yasashi-learning-backup-${stamp}.json`
}

function backupExportTime(exportedAt: number) {
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(exportedAt))
  } catch {
    return "时间未知"
  }
}

function backupRestoreDescription(backup: LearningBackup) {
  const entryCount = Object.keys(backup.entries).length
  const time = backupExportTime(backup.exportedAt)
  if (entryCount === 0) {
    return `备份时间：${time}。该备份不含学习数据；恢复后会清空当前浏览器里的学习进度、复习安排、错题本和朗读设置。`
  }
  return `备份时间：${time}，包含 ${entryCount} 类本地数据。恢复后会替换当前浏览器里的学习进度、复习安排、错题本和朗读设置。`
}

export function LearningDataPanel({ className }: { className?: string }) {
  const fileRef = React.useRef<HTMLInputElement | null>(null)
  const [notice, setNotice] = React.useState<Notice | null>(null)
  const [resetDialogOpen, setResetDialogOpen] = React.useState(false)
  const [pendingBackup, setPendingBackup] = React.useState<LearningBackup | null>(null)
  const [readingBackup, setReadingBackup] = React.useState(false)

  const exportData = React.useCallback(async () => {
    setResetDialogOpen(false)
    const backup = await runLearningWrite(() => tryCreateLearningBackup())
    if (!backup) {
      setNotice({ tone: "error", text: "无法读取本地学习数据，导出失败。" })
      return
    }

    let url: string | null = null
    let anchor: HTMLAnchorElement | null = null
    try {
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" })
      url = URL.createObjectURL(blob)
      anchor = document.createElement("a")
      anchor.href = url
      anchor.download = backupFileName(backup.exportedAt)
      document.body.appendChild(anchor)
      anchor.click()
      setNotice({ tone: "success", text: "备份已生成。" })
    } catch {
      setNotice({ tone: "error", text: "备份文件生成失败。" })
    } finally {
      anchor?.remove()
      if (url) URL.revokeObjectURL(url)
    }
  }, [])

  const importData = React.useCallback((file: File) => {
    setResetDialogOpen(false)
    setPendingBackup(null)
    setNotice(null)

    if (file.size > LEARNING_BACKUP_FILE_MAX_BYTES) {
      setNotice({ tone: "error", text: "备份文件超过 2 MB，无法导入。" })
      return
    }

    setReadingBackup(true)
    const reader = new FileReader()
    reader.onload = () => {
      const backup = parseLearningBackup(String(reader.result ?? ""))
      if (!backup) {
        setNotice({ tone: "error", text: "备份文件无法读取。" })
        return
      }

      setPendingBackup(backup)
    }
    reader.onloadend = () => setReadingBackup(false)
    reader.onerror = () => setNotice({ tone: "error", text: "备份文件无法读取。" })
    reader.onabort = () => setNotice({ tone: "error", text: "备份文件读取已取消。" })
    try {
      reader.readAsText(file)
    } catch {
      setReadingBackup(false)
      setNotice({ tone: "error", text: "备份文件无法读取。" })
    }
  }, [])

  const restorePendingBackup = React.useCallback(async () => {
    if (!pendingBackup) return

    if (!await runLearningWrite(() => restoreLearningBackup(pendingBackup), { replacesData: true })) {
      setNotice({ tone: "error", text: "导入失败。" })
      setPendingBackup(null)
      return
    }

    setNotice({ tone: "success", text: "学习数据已恢复。" })
    setPendingBackup(null)
  }, [pendingBackup])

  const resetData = React.useCallback(async () => {
    if (await runLearningWrite(() => resetLearningData(), { replacesData: true })) {
      setNotice({ tone: "success", text: "本地学习数据已清空。" })
      setResetDialogOpen(false)
      return
    }

    setNotice({ tone: "error", text: "清空失败。" })
  }, [])

  return (
    <section className={cn("paper-sheet p-5", className)} data-testid="learning-data-panel">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="text-sm font-semibold text-foreground">本地学习数据</div>
          <div className="text-xs text-muted-foreground">学习进度、复习安排、错题本和朗读设置只保存在这台设备上。</div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={exportData} data-testid="learning-data-export">
            <Download className="h-3.5 w-3.5" />
            导出
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={readingBackup}
            onClick={() => fileRef.current?.click()}
            data-testid="learning-data-import"
          >
            <Upload className="h-3.5 w-3.5" />
            {readingBackup ? "读取中" : "导入"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5 text-accent hover:border-accent/40 hover:bg-accent/5"
            onClick={() => {
              setNotice(null)
              setResetDialogOpen(true)
            }}
            aria-label="清空本地学习数据"
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
            "mt-4 border-y border-dashed px-3 py-2 text-xs",
            notice.tone === "success"
              ? "border-foreground/25 bg-primary/10 text-foreground"
              : "border-accent/30 bg-accent/10 text-accent"
          )}
          role={notice.tone === "error" ? "alert" : "status"}
          aria-live="polite"
          data-testid="learning-data-notice"
          data-tone={notice.tone}
        >
          {notice.text}
        </div>
      ) : null}

      <ConfirmActionDialog
        open={pendingBackup !== null}
        title="恢复学习数据"
        description={pendingBackup
          ? backupRestoreDescription(pendingBackup)
          : "恢复后会替换当前浏览器里的本地学习数据。"}
        confirmLabel="恢复数据"
        testId="learning-data-restore-dialog"
        onCancel={() => setPendingBackup(null)}
        onConfirm={restorePendingBackup}
      />

      <ConfirmActionDialog
        open={resetDialogOpen}
        title="清空本地学习数据"
        description="这会删除当前浏览器里的学习进度、复习安排、错题本和朗读设置。导出的备份文件不会受到影响。"
        confirmLabel="清空"
        testId="learning-data-reset-dialog"
        onCancel={() => setResetDialogOpen(false)}
        onConfirm={resetData}
      />
    </section>
  )
}
