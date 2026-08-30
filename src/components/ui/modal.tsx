"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ")

const openModalStack: HTMLDivElement[] = []

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
  ariaLabelledBy?: string
  ariaDescribedBy?: string
}

export function Modal({
  isOpen,
  onClose,
  children,
  className,
  ariaLabelledBy,
  ariaDescribedBy,
}: ModalProps) {
  const [show, setShow] = React.useState(isOpen)
  const previousOverflow = React.useRef<string | null>(null)
  const dialogRef = React.useRef<HTMLDivElement | null>(null)
  const previouslyFocused = React.useRef<HTMLElement | null>(null)

  const getFocusableElements = React.useCallback(() => {
    if (!dialogRef.current) return []

    return Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
      (element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true"
    )
  }, [])

  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined

    if (isOpen) {
      setShow(true)
      if (previousOverflow.current === null) {
        previousOverflow.current = document.body.style.overflow
      }
      document.body.style.overflow = "hidden" // Prevent scrolling
      // Remember the trigger so we can restore focus on close.
      previouslyFocused.current = (document.activeElement as HTMLElement | null) ?? null
    } else {
      timer = setTimeout(() => setShow(false), 300) // Wait for animation
      if (previousOverflow.current !== null) {
        document.body.style.overflow = previousOverflow.current
        previousOverflow.current = null
      }
      // Restore focus to the trigger.
      const prev = previouslyFocused.current
      if (prev && typeof prev.focus === "function") prev.focus()
      previouslyFocused.current = null
    }

    return () => {
      if (timer) clearTimeout(timer)
      if (previousOverflow.current !== null) {
        document.body.style.overflow = previousOverflow.current
        previousOverflow.current = null
      }
    }
  }, [isOpen])

  // Esc to close, trap tab focus, and focus dialog on open.
  React.useEffect(() => {
    if (!isOpen) return
    const dialog = dialogRef.current
    if (!dialog) return

    openModalStack.push(dialog)
    // Defer focus until after animation kicks in.
    const focusTimer = setTimeout(() => {
      dialog.focus()
    }, 50)

    const onKey = (e: KeyboardEvent) => {
      if (openModalStack.at(-1) !== dialog) return

      if (e.key === "Escape") {
        e.stopPropagation()
        onClose()
        return
      }

      if (e.key !== "Tab") {
        return
      }

      const focusableElements = getFocusableElements()
      if (focusableElements.length === 0) {
        e.preventDefault()
        dialog.focus()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      const activeElement = document.activeElement as HTMLElement | null

      if (e.shiftKey) {
        if (activeElement === dialog || activeElement === firstElement || !dialog.contains(activeElement)) {
          e.preventDefault()
          lastElement.focus()
        }
        return
      }

      if (activeElement === dialog || activeElement === lastElement || !dialog.contains(activeElement)) {
        e.preventDefault()
        firstElement.focus()
      }
    }
    window.addEventListener("keydown", onKey, true)
    return () => {
      clearTimeout(focusTimer)
      window.removeEventListener("keydown", onKey, true)
      const stackIndex = openModalStack.lastIndexOf(dialog)
      if (stackIndex >= 0) openModalStack.splice(stackIndex, 1)
    }
  }, [getFocusableElements, isOpen, onClose, show])

  if (!show) return null

  return (
    <div
      className={cn(
        "fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6",
        isOpen ? "animate-in fade-in duration-300" : "animate-out fade-out duration-300"
      )}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Content */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        tabIndex={-1}
        className={cn(
          "relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-sm border-[3px] border-foreground bg-card text-card-foreground shadow-hard outline-none",
          "transform transition-all duration-300",
          isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-4",
          className
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          aria-label="关闭"
          className="absolute right-4 top-4 z-10 bg-card"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
        {children}
      </div>
    </div>
  )
}
