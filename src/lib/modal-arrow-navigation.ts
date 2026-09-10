import { shouldHandleGlobalShortcutEvent } from "@/lib/keyboard-shortcuts"
import { isTopOpenModal } from "@/lib/open-modal-stack"

type ModalArrowSurface = (() => boolean) | EventTarget | Node | string | null

export function shouldHandleModalArrowNavigation(
  event: Pick<KeyboardEvent, "key" | "altKey" | "ctrlKey" | "metaKey" | "shiftKey" | "target">,
  surface: ModalArrowSurface = isTopOpenModal
): "ArrowLeft" | "ArrowRight" | null {
  if (!shouldHandleGlobalShortcutEvent(event)) return null
  const isSurfaceTop = typeof surface === "function" ? surface() : isTopOpenModal(surface)
  if (!isSurfaceTop) return null
  if (event.key === "ArrowRight" || event.key === "ArrowLeft") return event.key
  return null
}
