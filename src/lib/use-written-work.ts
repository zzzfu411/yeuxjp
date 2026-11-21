"use client"
import { useEffect, useRef, useState } from "react"
import { LEARNING_EVENT } from "@/lib/learning-storage"
import { LEARNING_STORE_EVENT } from "@/lib/learning-events"
import { runLearningWrite } from "@/lib/learning-write-lock"
import { STORAGE_KEYS, LEARNING_WRITE_EPOCH_KEY } from "@/lib/storage-keys"
import { readWrittenWorks, saveWrittenWork } from "@/lib/written-work-storage"
import { workToken, writingKey, type WritingTask, type WrittenWork, type WorkInput } from "@/lib/written-work-model"

const empty: WorkInput = { draft: "", checked: [], usedModel: false }
export function useWrittenWork(task: WritingTask) {
  const [input, setInput] = useState<WorkInput>(empty)
  const [state, setState] = useState({ loaded: false, error: false, pending: false, completed: false, history: [] as WrittenWork[] })
  const control = useRef({ token: workToken(), input: empty, pending: 0, failed: false, mounted: false, queue: Promise.resolve() })
  const key = writingKey(task)
  useEffect(() => {
    const local = control.current
    local.mounted = true
    const sync = () => {
      if (!local.mounted || local.pending || local.failed) return
      const stored = readWrittenWorks()
      const current = stored.value[key]
      local.token = workToken(current)
      local.input = current ?? empty
      setInput(local.input)
      setState({ loaded: true, error: !stored.ok, pending: false, completed: current?.completedAt !== undefined,
        history: Object.entries(stored.value).filter(([id, work]) => work.task.id === task.id && id !== key).map(([, work]) => work) })
    }
    const storage = (event: StorageEvent) => { if (event.key === null || event.key === STORAGE_KEYS.WRITTEN_WORKS) sync() }
    const beforeUnload = (event: BeforeUnloadEvent) => { if (local.pending || local.failed) { event.preventDefault(); event.returnValue = "" } }
    queueMicrotask(sync)
    window.addEventListener("storage", storage)
    window.addEventListener(LEARNING_EVENT, sync)
    window.addEventListener(LEARNING_STORE_EVENT, sync)
    window.addEventListener("beforeunload", beforeUnload)
    return () => { local.mounted = false; window.removeEventListener("storage", storage); window.removeEventListener(LEARNING_EVENT, sync)
      window.removeEventListener(LEARNING_STORE_EVENT, sync); window.removeEventListener("beforeunload", beforeUnload) }
  }, [key, task.id])

  const save = (next: WorkInput, complete = false) => {
    const local = control.current
    let epoch: string | null | undefined
    try { epoch = window.localStorage.getItem(LEARNING_WRITE_EPOCH_KEY) } catch { epoch = undefined }
    local.input = next
    local.pending++
    setInput(next)
    setState(current => ({ ...current, pending: true, completed: false }))
    local.queue = local.queue.then(async () => {
      const saved = await runLearningWrite(() => {
        if (epoch === undefined || window.localStorage.getItem(LEARNING_WRITE_EPOCH_KEY) !== epoch) return null
        const result = saveWrittenWork(task, next, local.token, complete)
        if (result) local.token = workToken(result)
        return result
      })
      local.pending--
      local.failed = !saved
      if (local.mounted) setState(current => ({ ...current, pending: local.pending > 0, error: !saved,
        completed: !!saved && saved.completedAt !== undefined && local.pending === 0 }))
    })
  }
  return { input, ...state, save,
    reloadSaved: () => { // Explicitly chosen by the user after saving/copying any conflicting local draft.
      if (control.current.pending) return
      control.current.failed = false
      window.dispatchEvent(new Event(LEARNING_EVENT))
    } }
}
