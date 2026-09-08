import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const stack = await loadTsModule("src/lib/open-modal-stack.ts")

function makeDialog(id, { connected = true, children = [] } = {}) {
  const overlay = { style: { zIndex: "" }, isConnected: connected }
  const dialog = {
    id,
    isConnected: connected,
    parentElement: overlay,
    contains(node) {
      return node === this || children.includes(node)
    },
    focusCalls: 0,
    focus() {
      this.focusCalls += 1
    },
  }
  overlay.dialog = dialog
  return dialog
}

test("a sole open modal is top and keeps the base overlay layer", () => {
  const openModals = stack.createOpenModalStack()
  const detail = makeDialog("detail")

  openModals.register(detail)

  assert.equal(openModals.isTopOpenModal(), true)
  assert.equal(openModals.isTopOpenModal(detail), true)
  assert.equal(detail.parentElement.style.zIndex, "100")
  assert.equal(openModals.shouldRestoreFocusOnModalClose(detail), true)
})

test("buried dialogs are not top once another modal is stacked above them", () => {
  const openModals = stack.createOpenModalStack()
  const detail = makeDialog("detail")
  const speech = makeDialog("speech")

  openModals.register(detail)
  openModals.register(speech)

  assert.equal(openModals.isTopOpenModal(), false)
  assert.equal(openModals.isTopOpenModal(detail), false)
  assert.equal(openModals.isTopOpenModal(speech), true)
  assert.equal(openModals.isTopOpenModal({}), false)
  assert.equal(detail.parentElement.style.zIndex, "100")
  assert.equal(speech.parentElement.style.zIndex, "101")
  assert.equal(openModals.remainingOpenModalTop(speech), detail)
  assert.equal(openModals.shouldRestoreFocusOnModalClose(speech), false)
  assert.equal(openModals.shouldRestoreFocusOnModalClose(detail), false)
})

test("Escape membership stays with the live top dialog after the overlay closes", () => {
  const openModals = stack.createOpenModalStack()
  const detail = makeDialog("detail")
  const speech = makeDialog("speech")

  openModals.register(detail)
  openModals.register(speech)
  assert.equal(openModals.isTopOpenModal(speech), true)
  assert.equal(openModals.isTopOpenModal(detail), false)

  openModals.unregister(speech)

  assert.equal(openModals.isTopOpenModal(detail), true)
  assert.equal(openModals.isTopOpenModal(speech), false)
  assert.equal(openModals.isTopOpenModal(), true)
  assert.equal(openModals.shouldRestoreFocusOnModalClose(detail), true)
})

test("soft remount of a keyed underlay keeps the existing overlay on top", () => {
  const openModals = stack.createOpenModalStack()
  const detail = makeDialog("detail-1")
  const speech = makeDialog("speech")
  const remounted = makeDialog("detail-2")

  openModals.register(detail, "url-controlled-reference")
  openModals.register(speech)
  openModals.unregister(detail)
  openModals.register(remounted, "url-controlled-reference")

  assert.deepEqual(openModals.getDialogs().map((dialog) => dialog.id), ["detail-2", "speech"])
  assert.equal(openModals.isTopOpenModal(speech), true)
  assert.equal(openModals.isTopOpenModal(remounted), false)
  assert.equal(openModals.isTopOpenModal(), false)
  assert.equal(remounted.parentElement.style.zIndex, "100")
  assert.equal(speech.parentElement.style.zIndex, "101")
})

test("unmount-while-open restores the trigger when it is the last overlay", () => {
  const openModals = stack.createOpenModalStack()
  const detail = makeDialog("detail")
  const trigger = makeDialog("trigger")

  openModals.register(detail)
  openModals.unregister(detail)

  openModals.restoreFocusOnModalClose(detail, trigger)

  assert.equal(trigger.focusCalls, 1)
  assert.equal(detail.focusCalls, 0)
})

test("unmount-while-open hands focus to the remaining top dialog", () => {
  const openModals = stack.createOpenModalStack()
  const detail = makeDialog("detail")
  const speech = makeDialog("speech")
  const trigger = makeDialog("trigger")

  openModals.register(detail)
  openModals.register(speech)
  openModals.unregister(detail)

  openModals.restoreFocusOnModalClose(detail, trigger)

  assert.equal(speech.focusCalls, 1)
  assert.equal(trigger.focusCalls, 0)
  assert.equal(detail.focusCalls, 0)
})

test("restore ignores a detached trigger and still hands off to a remaining overlay", () => {
  const openModals = stack.createOpenModalStack()
  const detail = makeDialog("detail")
  const speech = makeDialog("speech")
  const trigger = makeDialog("trigger", { connected: false })

  openModals.register(detail)
  openModals.register(speech)
  detail.isConnected = false

  openModals.restoreFocusOnModalClose(detail, trigger)

  assert.equal(speech.focusCalls, 1)
  assert.equal(trigger.focusCalls, 0)
})

test("disconnected underlays are pruned without promoting a remounted keyed dialog over speech", () => {
  const openModals = stack.createOpenModalStack()
  const detail = makeDialog("detail-1")
  const speech = makeDialog("speech")
  const remounted = makeDialog("detail-2")

  openModals.register(detail, "url-controlled-reference")
  openModals.register(speech)
  detail.isConnected = false
  openModals.register(remounted, "url-controlled-reference")

  assert.equal(openModals.isTopOpenModal(speech), true)
  assert.equal(openModals.isTopOpenModal(remounted), false)
  assert.deepEqual(openModals.getDialogs().map((dialog) => dialog.id), ["detail-2", "speech"])
})
