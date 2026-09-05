"use client"

import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { useRef, useState } from "react"

export interface ConfirmActionDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  testId?: string
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

export function ConfirmActionDialog({
  open,
  title,
  description,
  confirmLabel = "确认",
  cancelLabel = "取消",
  testId = "confirm-action-dialog",
  onConfirm,
  onCancel,
}: ConfirmActionDialogProps) {
  const pending = useRef(false)
  const [saving, setSaving] = useState(false)
  const confirm = async () => {
    if (pending.current) return
    pending.current = true
    setSaving(true)
    try { await onConfirm() } finally { pending.current = false; setSaving(false) }
  }
  const cancel = () => { if (!pending.current) onCancel() }
  const titleId = `${testId}-title`
  const descriptionId = `${testId}-description`

  return (
    <Modal
      isOpen={open}
      onClose={cancel}
      className="max-w-md p-0"
      ariaLabelledBy={titleId}
      ariaDescribedBy={descriptionId}
    >
      <div className="space-y-6 p-6" data-testid={testId}>
        <div className="flex items-start gap-4 pr-8">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-destructive/30 bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h2 id={titleId} className="text-lg font-semibold tracking-tight">
              {title}
            </h2>
            <p id={descriptionId} className="text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            data-testid={`${testId}-cancel`}
            onClick={cancel}
            disabled={saving}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="destructive"
            data-testid={`${testId}-confirm`}
            onClick={confirm}
            disabled={saving}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
