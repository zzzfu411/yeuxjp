import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("reference modal navigation hook owns selected index and arrow-key behavior", () => {
  const source = read("src/lib/use-indexed-modal-navigation.ts")

  assert.match(source, /export function useIndexedModalNavigation\(itemCount: number\)/)
  assert.match(source, /useState<number \| null>\(null\)/)
  assert.match(source, /rawSelectedIndex === null \|\| itemCount <= 0/)
  assert.match(source, /openAt/)
  assert.match(source, /Math\.min\(rawSelectedIndex, itemCount - 1\)/)
  assert.match(source, /selectedPosition/)
  assert.match(source, /event\.key === "ArrowRight"/)
  assert.match(source, /event\.key === "ArrowLeft"/)
  assert.match(source, /window\.addEventListener\("keydown", handleKeyDown\)/)
  assert.match(source, /window\.removeEventListener\("keydown", handleKeyDown\)/)
})

test("grammar page delegates modal navigation to the shared hook", () => {
  const source = read("src/app/grammar/page.tsx")

  assert.match(source, /from "@\/lib\/use-indexed-modal-navigation"/)
  assert.match(source, /useIndexedModalNavigation\(/)
  assert.match(source, /openAt\(index\)/)
  assert.match(source, /onClose=\{close\}/)
  assert.match(source, /onClick=\{goPrev\}/)
  assert.match(source, /onClick=\{goNext\}/)
  assert.match(source, /selectedPosition/)
  assert.doesNotMatch(source, /window\.addEventListener\("keydown"/)
  assert.doesNotMatch(source, /setSelectedIndex\(\(prev\)/)
})

test("semantics and pragmatics reference pages keep static lists in server components", () => {
  const pages = [
    {
      page: "src/app/semantics/page.tsx",
      modal: "src/components/reference/semantics-focus-modal.tsx",
      route: "/semantics",
      data: "semanticsData",
    },
    {
      page: "src/app/pragmatics/page.tsx",
      modal: "src/components/reference/pragmatics-focus-modal.tsx",
      route: "/pragmatics",
      data: "pragmaticsData",
    },
  ]

  for (const { page, modal, route, data } of pages) {
    const source = read(page)
    const modalSource = read(modal)

    assert.doesNotMatch(source, /"use client"/, page)
    assert.match(source, /searchParams\?: Promise<\{ item\?: string \}>/, page)
    assert.match(source, new RegExp(`${data}\\.findIndex`), page)
    assert.match(source, new RegExp(`${route}\\?item=\\$\\{encodeURIComponent`), page)
    assert.match(source, /selectedIndex === null \? null/, page)
    assert.match(source, /closeHref="/, page)
    assert.match(source, /prevHref=\{prevHref\}/, page)
    assert.match(source, /nextHref=\{nextHref\}/, page)
    assert.doesNotMatch(source, /useIndexedModalNavigation/, page)
    assert.doesNotMatch(source, /useState/, page)

    assert.match(modalSource, /UrlControlledReferenceModal/, modal)
    assert.match(modalSource, /SpeakButton/, modal)
    assert.match(modalSource, /selectedPosition/, modal)
  }
})

test("URL-controlled reference modal owns client-side close and arrow-key navigation", () => {
  const source = read("src/components/reference/url-controlled-reference-modal.tsx")

  assert.match(source, /"use client"/)
  assert.match(source, /useRouter\(\)/)
  assert.match(source, /router\.push\(closeHref\)/)
  assert.match(source, /event\.key === "ArrowRight"/)
  assert.match(source, /router\.push\(nextHref\)/)
  assert.match(source, /event\.key === "ArrowLeft"/)
  assert.match(source, /router\.push\(prevHref\)/)
  assert.match(source, /window\.addEventListener\("keydown", handleKeyDown\)/)
  assert.match(source, /window\.removeEventListener\("keydown", handleKeyDown\)/)
  assert.match(source, /<Modal isOpen onClose=\{close\}/)
})

test("vocabulary page keeps card-specific flip behavior while sharing indexed navigation", () => {
  const source = read("src/app/vocabulary/page.tsx")

  assert.match(source, /from "@\/lib\/use-indexed-modal-navigation"/)
  assert.match(source, /useIndexedModalNavigation\(currentDataLength\)/)
  assert.match(source, /onExpand=\{\(index\) => \{/)
  assert.match(source, /openAt\(index\)/)
  assert.match(source, /onClose=\{resetSelection\}/)
  assert.match(source, /onNext=\{handleNext\}/)
  assert.match(source, /onPrev=\{handlePrev\}/)
  assert.match(source, /goNext\(\)/)
  assert.match(source, /goPrev\(\)/)
  assert.match(source, /setIsModalFlipped\(false\)/)
  assert.match(source, /e\.key === " "/)
  assert.doesNotMatch(source, /e\.key === "ArrowRight"/)
  assert.doesNotMatch(source, /e\.key === "ArrowLeft"/)
  assert.doesNotMatch(source, /setSelectedIndex\(\(prev\)/)
})
