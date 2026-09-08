import { shouldHandleGlobalShortcutEvent } from "@/lib/keyboard-shortcuts"
import { isTopOpenModal } from "@/lib/open-modal-stack"

export function shouldHandleModalArrowNavigation(
  event: Pick<KeyboardEvent, "key" | "altKey" | "ctrlKey" | "metaKey" | "shiftKey" | "target">,
  isSurfaceTop: () => boolean = isTopOpenModal
): "ArrowLeft" | "ArrowRight" | null {
  if (!shouldHandleGlobalShortcutEvent(event)) return null
  if (!isSurfaceTop()) return null
  if (event.key === "ArrowRight" || event.key === "ArrowLeft") return event.key
  return null
}
