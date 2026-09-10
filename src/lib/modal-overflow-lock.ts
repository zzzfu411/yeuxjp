export type OverflowStyleHost = {
  style: {
    overflow: string
  }
}

export function createModalOverflowLock() {
  let lockCount = 0
  let savedOverflow: string | null = null

  return {
    acquire(host: OverflowStyleHost) {
      if (lockCount === 0) {
        savedOverflow = host.style.overflow
        host.style.overflow = "hidden"
      }
      lockCount += 1
    },
    release(host: OverflowStyleHost) {
      if (lockCount === 0) return
      lockCount -= 1
      if (lockCount === 0) {
        host.style.overflow = savedOverflow ?? ""
        savedOverflow = null
      }
    },
  }
}

const modalOverflowLock = createModalOverflowLock()

export const acquireModalOverflowLock = modalOverflowLock.acquire
export const releaseModalOverflowLock = modalOverflowLock.release
