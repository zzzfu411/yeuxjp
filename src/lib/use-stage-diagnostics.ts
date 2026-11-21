"use client"
import { useEffect, useRef, useState } from "react"
import { LEARNING_EVENT } from "@/lib/learning-storage"
import { LEARNING_STORE_EVENT } from "@/lib/learning-events"
import { runLearningWrite } from "@/lib/learning-write-lock"
import { STORAGE_KEYS } from "@/lib/storage-keys"
import { readStageDiagnostics, saveDiagnosticAction } from "@/lib/stage-diagnostic-storage"
import { EMPTY_DIAGNOSTIC_STORE, getDiagnosticEntryOrder, type DiagnosticAction } from "@/lib/stage-diagnostic-model"

export function useStageDiagnostics() {
  const [state, setState] = useState({ store: EMPTY_DIAGNOSTIC_STORE, loaded: false, error: false })
  const [pending, setPending] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const control = useRef({ mounted: false, writing: false })
  useEffect(() => {
    const local = control.current
    local.mounted = true
    let mounted = true
    const sync = () => { if (mounted) { const data = readStageDiagnostics(); setState({ store: data.value, loaded: true, error: !data.ok }) } }
    const storage = (event: StorageEvent) => { if (event.key === null || event.key === STORAGE_KEYS.DIAGNOSTICS) sync() }
    const unload = (event: BeforeUnloadEvent) => { if (local.writing) { event.preventDefault(); event.returnValue = "" } }
    queueMicrotask(sync)
    window.addEventListener("storage", storage); window.addEventListener(LEARNING_EVENT, sync); window.addEventListener(LEARNING_STORE_EVENT, sync); window.addEventListener("beforeunload", unload)
    return () => { mounted = false; local.mounted = false; window.removeEventListener("storage", storage); window.removeEventListener(LEARNING_EVENT, sync); window.removeEventListener(LEARNING_STORE_EVENT, sync); window.removeEventListener("beforeunload", unload) }
  }, [])
  const dispatch = async (action: DiagnosticAction) => {
    if (!state.loaded || state.error || control.current.writing) return false
    control.current.writing = true; setPending(true)
    const ok = await runLearningWrite(() => saveDiagnosticAction(action))
    control.current.writing = false
    if (control.current.mounted) { setPending(false); setSaveError(!ok) }
    return ok
  }
  return { ...state, pending, saveError, dispatch, entryOrder: getDiagnosticEntryOrder(state.store) }
}
