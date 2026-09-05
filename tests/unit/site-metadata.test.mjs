import assert from "node:assert/strict"
import test from "node:test"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { loadTsModule } from "./load-ts-module.mjs"

const metadata = await loadTsModule("src/lib/site-metadata.ts")
const { default: sitemap } = await loadTsModule("src/app/sitemap.ts")
const { RecoveryScreen } = await loadTsModule("src/components/learning/recovery-screen.tsx")

test("public routes have unique titles and canonical URLs without filter parameters", () => {
  const titles = metadata.PUBLIC_ROUTES.map(route => metadata.routeMetadata(route.path).title)
  assert.equal(new Set(titles).size, titles.length)
  for (const route of metadata.PUBLIC_ROUTES) {
    const result = metadata.routeMetadata(route.path)
    assert.ok(result.description.length > 15)
    assert.equal(result.alternates.canonical, route.path)
    assert.equal(result.openGraph.url, route.path)
    assert.equal(result.twitter.title, result.title)
  }
  assert.throws(() => metadata.routeMetadata("/not-real"), /Unknown public route/)
})

test("sitemap contains the complete known course and reference routes with no duplicates", () => {
  const entries = sitemap()
  const urls = entries.map(entry => entry.url)
  assert.equal(new Set(urls).size, urls.length)
  assert.equal(urls.filter(url => new URL(url).pathname.startsWith("/learn/")).length, 175)
  assert.equal(urls.filter(url => new URL(url).pathname.startsWith("/semantics/")).length, 100)
  assert.equal(urls.filter(url => new URL(url).pathname.startsWith("/pragmatics/")).length, 100)
  assert.ok(urls.every(url => new URL(url).origin === metadata.SITE_ORIGIN))
})

test("recovery UI renders safe navigation without exposing error payloads", () => {
  const html = renderToStaticMarkup(React.createElement(RecoveryScreen, { error: new Error("secret input content"), reset() {} }))
  assert.match(html, /页面暂时无法显示/)
  assert.match(html, /重新加载/)
  assert.match(html, /复制诊断信息/)
  assert.doesNotMatch(html, /secret input content/)
  assert.doesNotMatch(html, /清空数据|删除数据/)
})
