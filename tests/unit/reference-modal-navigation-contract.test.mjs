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

test("grammar route is a server shell around GrammarReferencePage", () => {
  const page = read("src/app/grammar/page.tsx")

  assert.doesNotMatch(page, /"use client"/)
  assert.match(page, /from "react"/)
  assert.match(page, /Suspense/)
  assert.match(page, /from "@\/components\/reference\/grammar-reference-page"/)
  assert.match(page, /<GrammarReferencePage \/>/)
})

test("GrammarReferencePage delegates modal navigation to the shared hook", () => {
  const source = read("src/components/reference/grammar-reference-page.tsx")

  assert.match(source, /from "@\/lib\/use-indexed-modal-navigation"/)
  assert.match(source, /useIndexedModalNavigation\(/)
  assert.match(source, /from "@\/lib\/grammar-page-model"/)
  assert.match(source, /parseGrammarLevel\(urlLevel\)/)
  assert.match(source, /filterGrammarPoints\(grammarData\[activeLevel\] \|\| \[\], searchQuery\)/)
  assert.match(source, /GRAMMAR_LEVELS\.map/)
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
      shell: "src/components/reference/semantics-reference-page.tsx",
      modal: "src/components/reference/semantics-focus-modal.tsx",
      route: "/semantics",
      data: "semanticsData",
    },
    {
      page: "src/app/pragmatics/page.tsx",
      shell: "src/components/reference/pragmatics-reference-page.tsx",
      modal: "src/components/reference/pragmatics-focus-modal.tsx",
      route: "/pragmatics",
      data: "pragmaticsData",
    },
  ]

  for (const { page, shell, modal, route, data } of pages) {
    const pageSource = read(page)
    const shellSource = read(shell)
    const modalSource = read(modal)

    assert.doesNotMatch(pageSource, /"use client"/, page)
    assert.doesNotMatch(pageSource, /searchParams/, page)
    assert.match(pageSource, /enableQueryRedirect/, page)

    assert.doesNotMatch(shellSource, /"use client"/, shell)
    assert.match(shellSource, new RegExp(`${data}\\.findIndex`), shell)
    assert.match(shellSource, new RegExp(`${route}/\\$\\{encodeURIComponent`), shell)
    assert.match(shellSource, /selectedIndex === null \? null/, shell)
    assert.match(shellSource, /closeHref="/, shell)
    assert.match(shellSource, /prevHref=\{prevHref\}/, shell)
    assert.match(shellSource, /nextHref=\{nextHref\}/, shell)
    assert.match(shellSource, /<Suspense fallback=\{null\}>/, shell)
    assert.match(shellSource, /ReferenceQueryRedirect/, shell)
    assert.doesNotMatch(shellSource, /useIndexedModalNavigation/, shell)
    assert.doesNotMatch(shellSource, /useState/, shell)

    assert.match(modalSource, /UrlControlledReferenceModal/, modal)
    assert.match(modalSource, /SpeakButton/, modal)
    assert.match(modalSource, /selectedPosition/, modal)
  }
})

test("semantics and pragmatics reference detail routes are statically generated", () => {
  const routes = [
    {
      source: "src/app/semantics/[itemId]/page.tsx",
      data: "semanticsData",
      shell: "SemanticsReferencePage",
      guard: "getSemanticsIndex",
    },
    {
      source: "src/app/pragmatics/[itemId]/page.tsx",
      data: "pragmaticsData",
      shell: "PragmaticsReferencePage",
      guard: "getPragmaticsIndex",
    },
  ]

  for (const { source: relPath, data, shell, guard } of routes) {
    const source = read(relPath)

    assert.doesNotMatch(source, /"use client"/, relPath)
    assert.match(source, /export function generateStaticParams\(\)/, relPath)
    assert.match(source, new RegExp(`${data}\\.map`), relPath)
    assert.match(source, /params: Promise<\{ itemId: string \}>/, relPath)
    assert.match(source, new RegExp(`${guard}\\(itemId\\) === null`), relPath)
    assert.match(source, /notFound\(\)/, relPath)
    assert.match(source, new RegExp(`<${shell} selectedItemId=\\{itemId\\}`), relPath)
  }
})

test("legacy reference query URLs redirect to static detail routes", () => {
  const source = read("src/components/reference/reference-query-redirect.tsx")

  assert.match(source, /"use client"/)
  assert.match(source, /useSearchParams\(\)/)
  assert.match(source, /searchParams\.get\("item"\)/)
  assert.match(source, /validIds\.includes\(itemId\)/)
  assert.match(source, /router\.replace\(`\$\{basePath\}\/\$\{encodeURIComponent\(itemId\)\}`\)/)
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
