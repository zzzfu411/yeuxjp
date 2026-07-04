import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const navigation = await loadTsModule("src/lib/pwa-navigation.ts")

const event = {
  defaultPrevented: false,
  button: 0,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
}

const currentLocation = {
  href: "https://yasashi.test/kana?set=seion",
  origin: "https://yasashi.test",
  pathname: "/kana",
  search: "?set=seion",
}

function anchor(overrides = {}) {
  return {
    href: "/learn/day-1-a-row-hello",
    absoluteHref: "https://yasashi.test/learn/day-1-a-row-hello",
    origin: "https://yasashi.test",
    pathname: "/learn/day-1-a-row-hello",
    search: "",
    hash: "",
    target: "",
    hasDownload: false,
    ...overrides,
  }
}

function should(overrides = {}) {
  return navigation.shouldUseDocumentNavigationOffline({
    event: { ...event, ...(overrides.event ?? {}) },
    anchor: overrides.anchor === undefined ? anchor() : overrides.anchor,
    currentLocation: { ...currentLocation, ...(overrides.currentLocation ?? {}) },
  })
}

test("offline navigation helper allows same-origin primary route clicks", () => {
  assert.equal(should(), true)
  assert.equal(should({ anchor: anchor({ absoluteHref: "/review", pathname: "/review" }) }), true)
  assert.equal(should({ anchor: anchor({
    href: "/semantics?item=aru-iru",
    absoluteHref: "https://yasashi.test/semantics?item=aru-iru",
    pathname: "/semantics",
    search: "?item=aru-iru",
  }) }), true)
})

test("offline navigation helper rejects modified or already-handled clicks", () => {
  assert.equal(should({ event: { defaultPrevented: true } }), false)
  assert.equal(should({ event: { button: 1 } }), false)
  assert.equal(should({ event: { metaKey: true } }), false)
  assert.equal(should({ event: { ctrlKey: true } }), false)
  assert.equal(should({ event: { shiftKey: true } }), false)
  assert.equal(should({ event: { altKey: true } }), false)
})

test("offline navigation helper rejects anchors that should stay browser-native", () => {
  assert.equal(should({ anchor: null }), false)
  assert.equal(should({ anchor: anchor({ hasDownload: true }) }), false)
  assert.equal(should({ anchor: anchor({ target: "_blank" }) }), false)
  assert.equal(should({ anchor: anchor({ href: "" }) }), false)
  assert.equal(should({ anchor: anchor({ href: "#section", absoluteHref: "https://yasashi.test/kana?set=seion#section", hash: "#section" }) }), false)
  assert.equal(should({ anchor: anchor({ absoluteHref: "https://example.test/review", origin: "https://example.test" }) }), false)
  assert.equal(should({ anchor: anchor({ href: "/kana?set=seion#table", absoluteHref: "https://yasashi.test/kana?set=seion#table", pathname: "/kana", search: "?set=seion", hash: "#table" }) }), false)
})

test("PWA document navigation helper promotes eligible links only when offline or service-worker controlled", () => {
  const args = {
    event,
    anchor: anchor({ href: "/vocabulary?level=daily", absoluteHref: "https://yasashi.test/vocabulary?level=daily" }),
    currentLocation,
  }

  assert.equal(navigation.shouldUsePwaDocumentNavigation({
    ...args,
    isOnline: false,
    hasServiceWorkerController: false,
  }), true)
  assert.equal(navigation.shouldUsePwaDocumentNavigation({
    ...args,
    isOnline: true,
    hasServiceWorkerController: true,
  }), true)
  assert.equal(navigation.shouldUsePwaDocumentNavigation({
    ...args,
    isOnline: true,
    hasServiceWorkerController: false,
  }), false)
})

test("PWA href navigation helper uses the same same-origin and hash-only guards", () => {
  assert.equal(navigation.shouldUsePwaDocumentNavigationForHref({
    href: "/semantics?item=aru-iru",
    currentLocation,
    isOnline: true,
    hasServiceWorkerController: true,
  }), true)
  assert.equal(navigation.shouldUsePwaDocumentNavigationForHref({
    href: "/kana?set=seion#table",
    currentLocation,
    isOnline: false,
    hasServiceWorkerController: false,
  }), false)
  assert.equal(navigation.shouldUsePwaDocumentNavigationForHref({
    href: "https://example.test/semantics?item=aru-iru",
    currentLocation,
    isOnline: false,
    hasServiceWorkerController: false,
  }), false)
})
