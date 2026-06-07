"use client"

import * as React from "react"
import { Headphones } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { SpeechSettingsBar } from "@/components/ui/speech-preferences"

export function SpeechControlsButton() {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="gap-2"
        onClick={() => setOpen(true)}
        aria-label="打开听力控制面板"
      >
        <Headphones className="w-4 h-4" />
        <span className="hidden sm:inline">听力</span>
      </Button>

      <Modal isOpen={open} onClose={() => setOpen(false)} className="max-w-lg">
        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <div className="text-lg font-bold">听力控制面板</div>
            <div className="text-sm text-muted-foreground">统一控制语速、重复与自动播放（测验 / 复习）。</div>
          </div>

          <SpeechSettingsBar showQuizOptions />
        </div>
      </Modal>
    </>
  )
}
