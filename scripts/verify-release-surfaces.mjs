import assert from "node:assert/strict"
import fs from "node:fs"

export async function verifyReleaseSurfaces(baseUrl, routes) {
  const records = []
  for (const route of routes) {
    const response = await fetch(baseUrl + route)
    assert.equal(response.status, 200, route)
    const html = await response.text()
    const title = html.match(/<title>(.*?)<\/title>/s)?.[1]
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/s)?.[1]
    const description = html.match(/<meta name="description" content="([^"]+)"/s)?.[1]
    assert.ok(title?.includes("Yasashi"), route + " has a page title")
    assert.ok(description?.length > 15, route + " has a description")
    assert.ok(canonical, route + " has a canonical URL")
    assert.equal(new URL(canonical).pathname, route)
    assert.equal(new URL(canonical).search, "")
    records.push({ route, title, canonical, description })
  }
  assert.equal(new Set(records.map(r => r.title)).size, records.length, "Every tested route has a distinct title")
  const sitemapResponse = await fetch(baseUrl + "/sitemap.xml")
  assert.equal(sitemapResponse.status, 200)
  const xml = await sitemapResponse.text()
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1])
  assert.equal(new Set(urls).size, urls.length)
  const normalizedUrls = new Set(urls.map(url => new URL(url).href))
  for (const record of records) assert.ok(normalizedUrls.has(new URL(record.canonical).href), record.route + " is discoverable in sitemap")
  const robotsResponse = await fetch(baseUrl + "/robots.txt")
  assert.equal(robotsResponse.status, 200)
  const robots = await robotsResponse.text()
  assert.ok(robots.includes(`Sitemap: ${new URL("/sitemap.xml", records[0].canonical).href}`))
  const missing = await fetch(baseUrl + "/__maturity_missing__")
  assert.equal(missing.status, 404)
  assert.match(await missing.text(), /没有找到这个页面/)
  const out = process.env.UI_EVIDENCE_DIR ?? "output/playwright/maturity-20260905"
  fs.mkdirSync(out, { recursive: true })
  fs.writeFileSync(`${out}/release-surfaces.json`, JSON.stringify({ records, sitemapEntries: urls.length, custom404: true }, null, 2))
  console.log(`Release surfaces passed: ${records.length} metadata routes, ${urls.length} sitemap entries, robots and custom 404`)
}
