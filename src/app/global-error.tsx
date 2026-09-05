"use client"

import { RecoveryScreen } from "@/components/learning/recovery-screen"

export default function GlobalError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="zh-CN"><body style={{ margin: "2rem", fontFamily: "sans-serif", lineHeight: 1.7 }}><RecoveryScreen {...props} /></body></html>
}
