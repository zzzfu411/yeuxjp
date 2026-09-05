"use client"

import { useState } from "react"

export function RecoveryScreen({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [diagnostic, setDiagnostic] = useState("")
  const [copied, setCopied] = useState(false)
  const copyDiagnostic = async () => {
    const text = JSON.stringify({ path: window.location.pathname, code: error.digest ?? error.name, time: new Date().toISOString() }, null, 2)
    setDiagnostic(text)
    try { await navigator.clipboard.writeText(text); setCopied(true) } catch { setCopied(false) }
  }
  return <section className="paper-wrap max-w-2xl py-16" aria-labelledby="recovery-title">
    <h1 id="recovery-title" className="font-brush text-3xl">页面暂时无法显示</h1>
    <p className="mt-4 leading-7">请先重试；若仍无法恢复，可以重新加载页面。已保存的学习数据不会因这些操作被清空。</p>
    <div className="my-6 flex flex-wrap gap-3">
      <button type="button" className="anime-button anime-button-primary px-4 py-3" onClick={reset}>重试</button>
      <button type="button" className="anime-button anime-button-outline px-4 py-3" onClick={() => window.location.reload()}>重新加载</button>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- Full navigation can recover a broken router or layout. */}
      <a href="/" className="anime-button anime-button-outline px-4 py-3">回到首页</a>
      <button type="button" className="px-3 py-2 underline" onClick={copyDiagnostic}>复制诊断信息</button>
    </div>
    {diagnostic && <div>
      <p role="status" className="text-sm">{copied ? "诊断信息已复制。" : "可手动复制下面的诊断信息。"}其中不含答题记录和输入内容。</p>
      <pre className="mt-3 overflow-auto border p-3 text-xs">{diagnostic}</pre>
    </div>}
  </section>
}
