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
  assert.match(source, /from "@\/lib\/keyboard-shortcuts"/)
  assert.match(source, /shouldHandleGlobalShortcut\(event\.target\)/)
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
  assert.match(source, /from "@\/components\/reference\/grammar-point-list"/)
  assert.match(source, /from "@\/components\/reference\/grammar-focus-modal"/)
  assert.match(source, /useIndexedModalNavigation\(/)
  assert.match(source, /from "@\/lib\/grammar-page-model"/)
  assert.match(source, /parseGrammarLevel\(urlLevel\)/)
  assert.match(source, /filterGrammarPoints\(grammarData\[activeLevel\] \|\| \[\], searchQuery\)/)
  assert.match(source, /GRAMMAR_LEVELS\.map/)
  assert.match(source, /<GrammarPointList points=\{currentPoints\} activeLevel=\{activeLevel\} onOpen=\{openAt\} \/>/)
  assert.match(source, /<GrammarFocusModal/)
  assert.match(source, /onClose=\{close\}/)
  assert.match(source, /onPrev=\{goPrev\}/)
  assert.match(source, /onNext=\{goNext\}/)
  assert.match(source, /selectedPosition/)
  assert.doesNotMatch(source, /Previous/)
  assert.doesNotMatch(source, /Next <ChevronRight/)
  assert.doesNotMatch(source, /Structure/)
  assert.doesNotMatch(source, /Examples/)
  assert.doesNotMatch(source, /window\.addEventListener\("keydown"/)
  assert.doesNotMatch(source, /setSelectedIndex\(\(prev\)/)
})

test("grammar list and focus modal own grammar presentation copy", () => {
  const list = read("src/components/reference/grammar-point-list.tsx")
  const modal = read("src/components/reference/grammar-focus-modal.tsx")

  assert.match(list, /export function GrammarPointList/)
  assert.match(list, /points: GrammarPoint\[\]/)
  assert.match(list, /activeLevel: Level/)
  assert.match(list, /onOpen: \(index: number\) => void/)
  assert.match(list, /function handleCardKeyDown/)
  assert.match(list, /event\.key !== "Enter" && event\.key !== " "/)
  assert.match(list, /event\.preventDefault\(\)/)
  assert.match(list, /onClick=\{\(\) => onOpen\(index\)\}/)
  assert.match(list, /onKeyDown=\{\(event\) => handleCardKeyDown\(event, \(\) => onOpen\(index\)\)\}/)
  assert.match(list, /role="button"/)
  assert.match(list, /tabIndex=\{0\}/)
  assert.match(list, /data-testid=\{`grammar-point-\$\{point\.id\}`\}/)
  assert.match(list, /结构/)
  assert.match(list, /例句/)

  assert.match(modal, /export function GrammarFocusModal/)
  assert.match(modal, /point: GrammarPoint \| null/)
  assert.match(modal, /<Modal/)
  assert.match(modal, /isOpen=\{isOpen\}/)
  assert.match(modal, /onClose=\{onClose\}/)
  assert.match(modal, /const titleId = "grammar-focus-modal-title"/)
  assert.match(modal, /const descriptionId = "grammar-focus-modal-description"/)
  assert.match(modal, /ariaLabelledBy=\{titleId\}/)
  assert.match(modal, /ariaDescribedBy=\{descriptionId\}/)
  assert.match(modal, /<h2 id=\{titleId\}/)
  assert.match(modal, /<p id=\{descriptionId\}/)
  assert.match(modal, /SpeakButton/)
  assert.match(modal, /语法 No\.\{selectedPosition\}/)
  assert.match(modal, /上一条/)
  assert.match(modal, /下一条/)
  assert.match(modal, /data-testid="grammar-modal-prev"/)
  assert.match(modal, /data-testid="grammar-modal-next"/)
  assert.match(modal, /结构/)
  assert.match(modal, /例句/)
  assert.doesNotMatch(modal, /Previous/)
  assert.doesNotMatch(modal, /Next <ChevronRight/)
  assert.doesNotMatch(modal, /Structure/)
  assert.doesNotMatch(modal, /Examples/)
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
    assert.match(modalSource, /const titleId = "/, modal)
    assert.match(modalSource, /const descriptionId = "/, modal)
    assert.match(modalSource, /ariaLabelledBy=\{titleId\}/, modal)
    assert.match(modalSource, /ariaDescribedBy=\{descriptionId\}/, modal)
    assert.match(modalSource, /SpeakButton/, modal)
    assert.match(modalSource, /selectedPosition/, modal)
    assert.match(modalSource, /上一条/, modal)
    assert.match(modalSource, /下一条/, modal)
    assert.doesNotMatch(modalSource, /Prev/, modal)
    assert.doesNotMatch(modalSource, /Next <ChevronRight/, modal)
  }

  const semanticsModal = read("src/components/reference/semantics-focus-modal.tsx")
  assert.match(semanticsModal, /语境例句/)
  assert.match(semanticsModal, /提示/)
  assert.doesNotMatch(semanticsModal, /Contextual Examples/)
  assert.doesNotMatch(semanticsModal, /Tip/)

  const pragmaticsPage = read("src/components/reference/pragmatics-reference-page.tsx")
  const pragmaticsModal = read("src/components/reference/pragmatics-focus-modal.tsx")
  assert.match(pragmaticsPage, /场景：\{scenario\.situation\}/)
  assert.match(pragmaticsModal, /场景：\{scenario\.situation\}/)
  assert.match(pragmaticsModal, /文化背景/)
  assert.match(pragmaticsModal, /回答分析/)
  assert.doesNotMatch(pragmaticsPage, /Scenario:/)
  assert.doesNotMatch(pragmaticsModal, /Scenario:/)
  assert.doesNotMatch(pragmaticsModal, /Cultural Context/)
  assert.doesNotMatch(pragmaticsModal, /Response Analysis/)
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
  assert.match(source, /from "@\/lib\/keyboard-shortcuts"/)
  assert.match(source, /shouldHandleGlobalShortcut\(event\.target\)/)
  assert.match(source, /event\.key === "ArrowRight"/)
  assert.match(source, /router\.push\(nextHref\)/)
  assert.match(source, /event\.key === "ArrowLeft"/)
  assert.match(source, /router\.push\(prevHref\)/)
  assert.match(source, /window\.addEventListener\("keydown", handleKeyDown\)/)
  assert.match(source, /window\.removeEventListener\("keydown", handleKeyDown\)/)
  assert.match(source, /ariaLabelledBy\?: string/)
  assert.match(source, /ariaDescribedBy\?: string/)
  assert.match(source, /<Modal/)
  assert.match(source, /isOpen/)
  assert.match(source, /onClose=\{close\}/)
  assert.match(source, /ariaLabelledBy=\{ariaLabelledBy\}/)
  assert.match(source, /ariaDescribedBy=\{ariaDescribedBy\}/)
})

test("vocabulary page keeps card-specific flip behavior while sharing indexed navigation", () => {
  const source = read("src/components/vocabulary/vocabulary-page.tsx")

  assert.match(source, /from "@\/lib\/use-indexed-modal-navigation"/)
  assert.match(source, /useIndexedModalNavigation\(currentData\.length\)/)
  assert.match(source, /onExpand=\{\(index\) => \{/)
  assert.match(source, /openAt\(index\)/)
  assert.match(source, /onClose=\{resetSelection\}/)
  assert.match(source, /onNext=\{handleNext\}/)
  assert.match(source, /onPrev=\{handlePrev\}/)
  assert.match(source, /goNext\(\)/)
  assert.match(source, /goPrev\(\)/)
  assert.match(source, /setIsModalFlipped\(false\)/)
  assert.doesNotMatch(source, /window\.addEventListener\("keydown", handleKeyDown\)/)
  assert.doesNotMatch(source, /shouldHandleGlobalShortcut\(e\.target\)/)
  assert.doesNotMatch(source, /e\.key === " "/)
  assert.doesNotMatch(source, /e\.key === "ArrowRight"/)
  assert.doesNotMatch(source, /e\.key === "ArrowLeft"/)
  assert.doesNotMatch(source, /setSelectedIndex\(\(prev\)/)
})
