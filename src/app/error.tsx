"use client"

import { RecoveryScreen } from "@/components/learning/recovery-screen"

export default function ErrorPage(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RecoveryScreen {...props} />
}
