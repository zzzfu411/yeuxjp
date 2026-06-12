import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const { shouldHandleGlobalShortcut, shouldHandleGlobalShortcutEvent } = await loadTsModule("src/lib/keyboard-shortcuts.ts")

function element(tagName, attributes = {}) {
  const node = {
    attributes,
    isContentEditable: !!attributes.contenteditable,
    closest(selector) {
      if (selector.includes(tagName) || selector.includes(`[role='${attributes.role}']`) || (attributes.tabindex && selector.includes("[tabindex]"))) {
        return this
      }
      return null
    },
    getAttribute(name) {
      return attributes[name] ?? null
    },
  }

  Object.setPrototypeOf(node, global.HTMLElement.prototype)
  return node
}

test.before(() => {
  global.Element ??= class Element {}
  global.HTMLElement ??= class HTMLElement extends global.Element {}
})

test("global shortcut guard allows non-element or passive page targets", () => {
  assert.equal(shouldHandleGlobalShortcut(null), true)
  assert.equal(shouldHandleGlobalShortcut({}), true)
  assert.equal(shouldHandleGlobalShortcut(element("div")), true)
})

test("global shortcut guard ignores editable and interactive targets", () => {
  assert.equal(shouldHandleGlobalShortcut(element("input")), false)
  assert.equal(shouldHandleGlobalShortcut(element("textarea")), false)
  assert.equal(shouldHandleGlobalShortcut(element("button")), false)
  assert.equal(shouldHandleGlobalShortcut(element("a", { href: "#" })), false)
  assert.equal(shouldHandleGlobalShortcut(element("div", { role: "button" })), false)
  assert.equal(shouldHandleGlobalShortcut(element("div", { tabindex: "0" })), false)
  assert.equal(shouldHandleGlobalShortcut(element("div", { contenteditable: "true" })), false)
})

test("global shortcut guard lets explicit shortcut zones opt back in", () => {
  assert.equal(shouldHandleGlobalShortcut(element("button", { "data-global-shortcuts": "allow" })), true)
})

test("global shortcut event guard ignores modified key combinations", () => {
  const target = element("div")

  assert.equal(shouldHandleGlobalShortcutEvent({ target, altKey: false, ctrlKey: false, metaKey: false, shiftKey: false }), true)
  assert.equal(shouldHandleGlobalShortcutEvent({ target, altKey: true, ctrlKey: false, metaKey: false, shiftKey: false }), false)
  assert.equal(shouldHandleGlobalShortcutEvent({ target, altKey: false, ctrlKey: true, metaKey: false, shiftKey: false }), false)
  assert.equal(shouldHandleGlobalShortcutEvent({ target, altKey: false, ctrlKey: false, metaKey: true, shiftKey: false }), false)
  assert.equal(shouldHandleGlobalShortcutEvent({ target, altKey: false, ctrlKey: false, metaKey: false, shiftKey: true }), false)
})
