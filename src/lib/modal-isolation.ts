const layers: HTMLElement[] = []
const previousInert = new Map<HTMLElement, boolean>()
let previousOverflow = ""
let observer: MutationObserver | undefined

function synchronize() {
  for (const [element, inert] of previousInert) element.inert = inert
  previousInert.clear()
  const top = layers.at(-1)
  if (!top) return
  const overlay = top.closest("[data-modal-layer]")
  for (const element of Array.from(document.body.children)) {
    if (!(element instanceof HTMLElement) || element === overlay || element.contains(top)) continue
    previousInert.set(element, element.inert)
    element.inert = true
  }
}

export function isolateModalBackground(dialog: HTMLElement) {
  if (!layers.length) {
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    observer = new MutationObserver(synchronize)
    observer.observe(document.body, { childList: true })
  }
  layers.push(dialog)
  synchronize()
  return () => {
    const index = layers.lastIndexOf(dialog)
    if (index >= 0) layers.splice(index, 1)
    synchronize()
    if (!layers.length) {
      observer?.disconnect()
      observer = undefined
      document.body.style.overflow = previousOverflow
    }
  }
}
