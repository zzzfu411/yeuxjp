"use client"

import { useEffect, useState } from "react"
import { LEARNING_WRITE_ERROR_EVENT } from "@/lib/learning-write-lock"

const messages: Record<string, string> = {
  unsupported: "当前浏览器无法安全保存学习数据。请通过 HTTPS 或 localhost 打开，并使用支持 Web Locks 的浏览器。已有记录仍可查看。",
  busy: "其他页面仍在保存数据，本次操作尚未保存。请稍后重试。",
  invalidated: "另一页面刚刚导入或重置了学习数据，本次操作已取消。请刷新后继续。",
  failed: "本次数据操作未能完成，请检查浏览器存储权限和可用空间后重试。",
}

export function LearningStorageNotice() {
  const [reason, setReason] = useState<string | null>(null)
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!navigator.locks?.request) setReason("unsupported")
    }, 0)
    const onFailure = (event: Event) => setReason((event as CustomEvent<string>).detail)
    window.addEventListener(LEARNING_WRITE_ERROR_EVENT, onFailure)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener(LEARNING_WRITE_ERROR_EVENT, onFailure)
    }
  }, [])
  if (!reason) return null
  return <aside role="alert" data-testid="learning-storage-notice" className="fixed inset-x-3 top-[4.5rem] z-[70] mx-auto flex max-h-[calc(100dvh-6rem)] max-w-3xl items-start gap-3 overflow-y-auto border-2 border-foreground bg-background p-4 text-sm shadow-lg sm:top-20">
    <p className="min-w-0 flex-1">{messages[reason] ?? messages.failed}</p>
    <button type="button" aria-label="关闭保存提示" className="min-h-11 shrink-0 px-2 underline underline-offset-4" onClick={() => setReason(null)}>关闭</button>
  </aside>
}
