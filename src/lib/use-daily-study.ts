"use client"
import { useEffect, useRef, useState } from "react"
import { LEARNING_EVENT } from "@/lib/learning-storage"
import { LEARNING_STORE_EVENT } from "@/lib/learning-events"
import { readDailyStudyPlans, saveNewDailyPlan, confirmDailyReading } from "@/lib/daily-study-storage"
import { readWrittenWorks } from "@/lib/written-work-storage"
import { runLearningWrite } from "@/lib/learning-write-lock"
import type { DailyStudyPlans, DailyStudyPlan } from "@/lib/daily-study-plan"
import type { WrittenWorkMap } from "@/lib/written-work-model"
import { STORAGE_KEYS } from "@/lib/storage-keys"
import { generateSafeId } from "@/lib/safe-id"

export function useDailyStudy() {
  const [state, setState] = useState({ plans: {} as DailyStudyPlans, works: {} as WrittenWorkMap, loaded: false, error: false })
  const [saveError, setSaveError] = useState(false)
  const [pending, setPending] = useState(false)
  const [pendingConfirmation, setPendingConfirmation] = useState<{ planId: string; taskId: string; confirmed: boolean } | null>(null)
  const control = useRef({ mounted: false, writing: false })
  useEffect(() => {
    const local = control.current
    local.mounted = true
    let mounted = true
    const sync = () => { if (mounted) { const plans = readDailyStudyPlans(); const works = readWrittenWorks()
      setState({ plans: plans.value, works: works.value, loaded: true, error: !plans.ok || !works.ok }) } }
    const storage = (event: StorageEvent) => { if (event.key === null || event.key === STORAGE_KEYS.DAILY_STUDY_PLANS || event.key === STORAGE_KEYS.WRITTEN_WORKS) sync() }
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (local.writing) { event.preventDefault(); event.returnValue = "" }
    }
    queueMicrotask(sync)
    window.addEventListener("storage", storage); window.addEventListener(LEARNING_EVENT, sync); window.addEventListener(LEARNING_STORE_EVENT, sync)
    window.addEventListener("beforeunload", beforeUnload)
    return () => { mounted = false; local.mounted = false; window.removeEventListener("storage", storage); window.removeEventListener(LEARNING_EVENT, sync); window.removeEventListener(LEARNING_STORE_EVENT, sync); window.removeEventListener("beforeunload", beforeUnload) }
  }, [])
  const write = async (fn: () => boolean, confirmation: typeof pendingConfirmation = null) => {
    if (control.current.writing) return false
    control.current.writing = true
    setPending(true)
    setPendingConfirmation(confirmation)
    const ok = await runLearningWrite(fn)
    control.current.writing = false
    if (control.current.mounted) {
      setSaveError(!ok)
      setPending(false)
      setPendingConfirmation(null)
    }
    return ok
  }
  return { ...state, saveError, pending, pendingConfirmation,
    start: (preview: DailyStudyPlan) => write(() => saveNewDailyPlan(preview, generateSafeId())),
    confirm: (planId: string, taskId: string, confirmed: boolean) => write(() => confirmDailyReading(planId, taskId, confirmed), { planId, taskId, confirmed }) }
}
