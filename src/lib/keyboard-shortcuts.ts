const INTERACTIVE_SELECTOR = [
  "a[href]",
  "button",
  "input",
  "select",
  "textarea",
  "summary",
  "[role='button']",
  "[role='link']",
  "[role='menuitem']",
  "[role='option']",
  "[tabindex]:not([tabindex='-1'])",
].join(", ")

export function shouldHandleGlobalShortcut(target: EventTarget | null) {
  if (typeof Element === "undefined") return true
  if (!(target instanceof Element)) return true

  if (typeof HTMLElement !== "undefined" && target instanceof HTMLElement && target.isContentEditable) return false

  const interactiveElement = target.closest(INTERACTIVE_SELECTOR)
  if (!interactiveElement) return true

  return interactiveElement.getAttribute("data-global-shortcuts") === "allow"
}
