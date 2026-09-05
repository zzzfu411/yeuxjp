const LOCK_STATE = Symbol.for("yasashi.learning.write-lock")
type LockGlobal = typeof globalThis & { [LOCK_STATE]?: boolean }

export function setLearningWriteLockHeld(held: boolean) {
  ;(globalThis as LockGlobal)[LOCK_STATE] = held
}

export function assertLearningWriteLock() {
  if (typeof window !== "undefined" && window.document && !(globalThis as LockGlobal)[LOCK_STATE]) {
    throw new Error("Learning writes require runLearningWrite")
  }
}
