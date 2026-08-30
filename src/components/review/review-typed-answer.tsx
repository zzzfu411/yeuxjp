"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export function ReviewTypedAnswer({
  disabled,
  onSubmit,
}: {
  disabled: boolean
  onSubmit: (value: string) => void
}) {
  const [value, setValue] = useState("")

  return (
    <form
      className="flex w-full flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        const next = value.trim()
        if (disabled || !next) return
        onSubmit(next)
      }}
    >
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        disabled={disabled}
        data-testid="review-typed-answer"
        aria-label="输入复习答案"
        className="h-14 w-full border-[2px] border-foreground bg-background px-4 text-lg font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring"
        autoComplete="off"
      />
      <Button type="submit" disabled={disabled || !value.trim()} data-testid="review-typed-submit">
        提交
      </Button>
    </form>
  )
}
