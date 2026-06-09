"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

interface ReferenceQueryRedirectProps {
  basePath: string
  validIds: readonly string[]
}

export function ReferenceQueryRedirect({ basePath, validIds }: ReferenceQueryRedirectProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const itemId = searchParams.get("item")
    if (!itemId || !validIds.includes(itemId)) return

    router.replace(`${basePath}/${encodeURIComponent(itemId)}`)
  }, [basePath, router, searchParams, validIds])

  return null
}
