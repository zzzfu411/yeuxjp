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
      className="flex w-full flex-col gap-4"
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
        className="h-14 w-full rounded-none border-0 border-b border-dashed border-foreground/40 bg-transparent px-2 text-center font-jp text-lg font-semibold outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-accent focus-visible:ring-0"
        autoComplete="off"
      />
      <Button type="submit" disabled={disabled || !value.trim()} data-testid="review-typed-submit">
        提交
      </Button>
    </form>
  )
}
