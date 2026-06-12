"use client"

import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"

export interface ConfirmActionDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  testId?: string
  onConfirm: () => void
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
  const titleId = `${testId}-title`
  const descriptionId = `${testId}-description`

  return (
    <Modal
      isOpen={open}
      onClose={onCancel}
      className="max-w-md rounded-2xl p-0"
      ariaLabelledBy={titleId}
      ariaDescribedBy={descriptionId}
    >
      <div className="space-y-6 p-6" data-testid={testId}>
        <div className="flex items-start gap-4 pr-8">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-destructive/20 bg-destructive/10 text-destructive">
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
          <Button type="button" variant="outline" className="rounded-full" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="rounded-full"
            data-testid={`${testId}-confirm`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
