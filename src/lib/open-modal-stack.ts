export type OpenModalDialog = {
  isConnected: boolean
  parentElement: { style: { zIndex: string } } | null
  contains?: (node: Node) => boolean
  focus?: () => void
}

type OpenModalEntry = {
  dialog: OpenModalDialog
  stackKey?: string
}

const BASE_OVERLAY_Z_INDEX = 100

function overlayHost(dialog: OpenModalDialog) {
  return dialog.parentElement ?? { style: { zIndex: "" } }
}

function isDialogMember(dialog: OpenModalDialog, member: EventTarget | Node | null | undefined) {
  if (member == null) return false
  if (dialog === member) return true
  if (typeof dialog.contains !== "function") return false
  try {
    return dialog.contains(member as Node)
  } catch {
    return false
  }
}

export function createOpenModalStack() {
  const stack: OpenModalEntry[] = []
  const reservedKeyIndexes = new Map<string, number>()

  function prune() {
    for (let index = stack.length - 1; index >= 0; index -= 1) {
      if (stack[index].dialog.isConnected) continue
      const [removed] = stack.splice(index, 1)
      if (removed.stackKey) reservedKeyIndexes.set(removed.stackKey, index)
      for (const [key, reservedIndex] of reservedKeyIndexes) {
        if (key === removed.stackKey) continue
        if (reservedIndex > index) reservedKeyIndexes.set(key, reservedIndex - 1)
      }
    }
  }

  function syncLayering() {
    stack.forEach((entry, index) => {
      overlayHost(entry.dialog).style.zIndex = String(BASE_OVERLAY_Z_INDEX + index)
    })
  }

  function topEntry() {
    prune()
    return stack.at(-1)
  }

  function register(dialog: OpenModalDialog, stackKey?: string) {
    prune()

    if (stackKey) {
      const existingIndex = stack.findIndex((entry) => entry.stackKey === stackKey)
      if (existingIndex >= 0) {
        stack[existingIndex] = { dialog, stackKey }
        reservedKeyIndexes.delete(stackKey)
        syncLayering()
        return
      }

      const reservedIndex = reservedKeyIndexes.get(stackKey)
      if (reservedIndex !== undefined) {
        const insertAt = Math.max(0, Math.min(reservedIndex, stack.length))
        stack.splice(insertAt, 0, { dialog, stackKey })
        reservedKeyIndexes.delete(stackKey)
        syncLayering()
        return
      }
    }

    if (stack.some((entry) => entry.dialog === dialog)) {
      syncLayering()
      return
    }

    stack.push({ dialog, stackKey })
    if (stackKey) reservedKeyIndexes.delete(stackKey)
    syncLayering()
  }

  function unregister(dialog: OpenModalDialog) {
    let index = -1
    for (let cursor = stack.length - 1; cursor >= 0; cursor -= 1) {
      if (stack[cursor].dialog === dialog) {
        index = cursor
        break
      }
    }
    if (index < 0) return

    const [removed] = stack.splice(index, 1)
    if (removed.stackKey) reservedKeyIndexes.set(removed.stackKey, index)
    for (const [key, reservedIndex] of reservedKeyIndexes) {
      if (key === removed.stackKey) continue
      if (reservedIndex > index) reservedKeyIndexes.set(key, reservedIndex - 1)
    }
    syncLayering()
  }

  function isTopOpenModal(member?: EventTarget | Node | null) {
    const top = topEntry()
    if (!top) return true
    if (member == null) return stack.length <= 1
    return isDialogMember(top.dialog, member)
  }

  function remainingOpenModalTop(excluding?: OpenModalDialog | null) {
    prune()
    for (let index = stack.length - 1; index >= 0; index -= 1) {
      if (stack[index].dialog !== excluding) return stack[index].dialog
    }
    return undefined
  }

  function shouldRestoreFocusOnModalClose(closingDialog?: OpenModalDialog | null) {
    return remainingOpenModalTop(closingDialog) == null
  }

  function restoreFocusOnModalClose(
    closingDialog?: OpenModalDialog | null,
    previouslyFocused?: { isConnected: boolean; focus?: () => void } | null,
  ) {
    // URL-controlled modals unmount while still open, so this must run from
    // effect cleanup as well as the isOpen→false path.
    if (shouldRestoreFocusOnModalClose(closingDialog)) {
      if (previouslyFocused?.isConnected && typeof previouslyFocused.focus === "function") {
        previouslyFocused.focus()
      }
      return
    }
    remainingOpenModalTop(closingDialog)?.focus?.()
  }

  function reset() {
    stack.length = 0
    reservedKeyIndexes.clear()
  }

  return {
    register,
    unregister,
    prune,
    isTopOpenModal,
    remainingOpenModalTop,
    shouldRestoreFocusOnModalClose,
    restoreFocusOnModalClose,
    reset,
    getDialogs() {
      return stack.map((entry) => entry.dialog)
    },
  }
}

const openModalStack = createOpenModalStack()

export const registerOpenModal = openModalStack.register
export const unregisterOpenModal = openModalStack.unregister
export const pruneOpenModalStack = openModalStack.prune
export const isTopOpenModal = openModalStack.isTopOpenModal
export const remainingOpenModalTop = openModalStack.remainingOpenModalTop
export const shouldRestoreFocusOnModalClose = openModalStack.shouldRestoreFocusOnModalClose
export const restoreFocusOnModalClose = openModalStack.restoreFocusOnModalClose
export const resetOpenModalStackForTests = openModalStack.reset
