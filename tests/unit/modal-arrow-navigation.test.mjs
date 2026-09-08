import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const arrows = await loadTsModule("src/lib/modal-arrow-navigation.ts")
const stack = await loadTsModule("src/lib/open-modal-stack.ts")

function keyEvent(key, extras = {}) {
  return {
    key,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    target: {},
    ...extras,
  }
}

function makeDialog(id) {
  const overlay = { style: { zIndex: "" }, isConnected: true }
  return {
    id,
    isConnected: true,
    parentElement: overlay,
    contains(node) {
      return node === this
    },
  }
}

function bindStack(openModals) {
  return (event) => arrows.shouldHandleModalArrowNavigation(event, () => openModals.isTopOpenModal())
}

test("arrow navigation stays live for a sole open modal", () => {
  const openModals = stack.createOpenModalStack()
  const decide = bindStack(openModals)
  openModals.register(makeDialog("detail"))

  assert.equal(decide(keyEvent("ArrowRight")), "ArrowRight")
  assert.equal(decide(keyEvent("ArrowLeft")), "ArrowLeft")
  assert.equal(decide(keyEvent("Escape")), null)
})

test("buried arrow handlers are inert while another modal is topmost", () => {
  const openModals = stack.createOpenModalStack()
  const decide = bindStack(openModals)
  const detail = makeDialog("detail")
  const speech = makeDialog("speech")

  openModals.register(detail)
  openModals.register(speech)

  assert.equal(openModals.isTopOpenModal(detail), false)
  assert.equal(openModals.isTopOpenModal(speech), true)
  assert.equal(decide(keyEvent("ArrowRight")), null)
  assert.equal(decide(keyEvent("ArrowLeft")), null)
})

test("arrow navigation stays inert after a keyed underlay remounts under speech", () => {
  const openModals = stack.createOpenModalStack()
  const decide = bindStack(openModals)
  const detail = makeDialog("detail-1")
  const speech = makeDialog("speech")
  const remounted = makeDialog("detail-2")

  openModals.register(detail, "url-controlled-reference")
  openModals.register(speech)
  openModals.unregister(detail)
  openModals.register(remounted, "url-controlled-reference")

  assert.equal(openModals.isTopOpenModal(speech), true)
  assert.equal(openModals.isTopOpenModal(remounted), false)
  assert.equal(decide(keyEvent("ArrowRight")), null)
  assert.equal(decide(keyEvent("ArrowLeft")), null)
})

test("arrow navigation ignores modified keys even when the surface is topmost", () => {
  const openModals = stack.createOpenModalStack()
  const decide = bindStack(openModals)
  openModals.register(makeDialog("detail"))

  assert.equal(decide(keyEvent("ArrowRight", { ctrlKey: true })), null)
  assert.equal(arrows.shouldHandleModalArrowNavigation(keyEvent("ArrowLeft"), () => true), "ArrowLeft")
  assert.equal(arrows.shouldHandleModalArrowNavigation(keyEvent("ArrowRight"), () => false), null)
})
