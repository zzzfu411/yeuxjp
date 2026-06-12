import assert from "node:assert/strict"

export async function verifyPwaUpdateBannerFlow(page, baseUrl) {
  await page.goto(baseUrl, { waitUntil: "networkidle" })
  await page.evaluate(() => window.dispatchEvent(new Event("yasashi:pwa-update-ready")))

  const banner = page.getByTestId("pwa-update-banner")
  await banner.waitFor({ state: "visible" })
  await page.getByRole("region", { name: "应用更新" }).waitFor({ state: "visible" })
  await page.getByText("新版本已准备好").waitFor({ state: "visible" })
  await page.getByText("刷新后可同步最新离线文件。").waitFor({ state: "visible" })

  await page.getByTestId("pwa-update-dismiss").click()
  await banner.waitFor({ state: "hidden" })

  await page.evaluate(() => window.dispatchEvent(new Event("yasashi:pwa-update-ready")))
  await banner.waitFor({ state: "visible" })

  const [frame] = await Promise.all([
    page.waitForEvent("framenavigated"),
    page.getByTestId("pwa-update-refresh").click(),
  ])
  assert.equal(frame, page.mainFrame(), "PWA update refresh should reload the current document")
}
