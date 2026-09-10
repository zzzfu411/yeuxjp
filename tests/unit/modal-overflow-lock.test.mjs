import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const lock = await loadTsModule("src/lib/modal-overflow-lock.ts")

function makeHost(overflow = "") {
  return { style: { overflow } }
}

test("a single modal overflow lock hides body scroll and restores the previous value", () => {
  const overlayLock = lock.createModalOverflowLock()
  const host = makeHost("auto")

  overlayLock.acquire(host)
  assert.equal(host.style.overflow, "hidden")

  overlayLock.release(host)
  assert.equal(host.style.overflow, "auto")
})

test("nested modal overflow locks keep body hidden until the last overlay releases", () => {
  const overlayLock = lock.createModalOverflowLock()
  const host = makeHost("")

  overlayLock.acquire(host)
  overlayLock.acquire(host)
  assert.equal(host.style.overflow, "hidden")

  overlayLock.release(host)
  assert.equal(host.style.overflow, "hidden")

  overlayLock.release(host)
  assert.equal(host.style.overflow, "")
})

test("releasing an inner URL modal while speech stays open does not unlock body scroll", () => {
  const overlayLock = lock.createModalOverflowLock()
  const host = makeHost("")

  overlayLock.acquire(host) // page / URL-controlled modal
  overlayLock.acquire(host) // navbar speech overlay
  overlayLock.release(host) // underlying modal dismissed first
  assert.equal(host.style.overflow, "hidden")

  overlayLock.release(host)
  assert.equal(host.style.overflow, "")
})

test("extra overflow lock releases are no-ops after the last overlay closes", () => {
  const overlayLock = lock.createModalOverflowLock()
  const host = makeHost("scroll")

  overlayLock.acquire(host)
  overlayLock.release(host)
  overlayLock.release(host)
  assert.equal(host.style.overflow, "scroll")
})
