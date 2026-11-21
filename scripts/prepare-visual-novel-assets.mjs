import fs from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"

const sourceRoot = process.argv[2]
if (!sourceRoot) throw new Error("Pass the directory containing the original generated images")
const assetSets = { original: [
  ["exec-ea83303a-0e3a-410f-8d0a-09953364dd1b.png", "study-day"],
  ["exec-abc434fc-fdf4-4770-934c-868a48992f54.png", "study-night"],
], megumi: [
  ["exec-8429ec82-4795-4532-b3f5-b1c35f22f8fd.png", "megumi-day"],
  ["exec-8118527b-a728-4994-887c-eb27ab748755.png", "megumi-night"],
], manga: [
  ["exec-8358a8b2-531e-4c80-b1ba-0ec8178bffcd.png", "megumi-manga"],
], "ink-manga": [
  ["exec-34e62c23-1ec0-4987-a807-3e0d27b48504.png", "megumi-ink-manga"],
], companions: [
  ["exec-37cbce70-d940-4b70-aff4-a9996df595cd.png", "megumi-blush-manga"],
  ["exec-dc23f01b-bfd6-487e-bc8a-ab77ac8f2dde.png", "kurisu-tsundere"],
  ["exec-e84b1440-0ab2-4685-83eb-efb39fb16eea.png", "emilia-wave"],
], "megumi-calm": [
  ["exec-8a726039-b4f0-438c-bcef-a76bd816b88e.png", "megumi-calm-manga"],
] }
const assets = assetSets[process.argv[3] ?? "original"]
if (!assets) throw new Error("Asset set must be original, megumi, manga, ink-manga, companions or megumi-calm")
await fs.mkdir("public/assets/visual-novel", { recursive: true })
await fs.mkdir("output/imagegen/visual-novel", { recursive: true })
for (const [source, name] of assets) {
  const input = path.join(sourceRoot, source)
  await fs.copyFile(input, `output/imagegen/visual-novel/${name}-original.png`)
  const output = `public/assets/visual-novel/${name}.webp`
  const width = name === "kurisu-tsundere" || name === "emilia-wave" ? 640 : 1536
  await sharp(input).resize({ width, withoutEnlargement: true }).webp(name.includes("manga") ? { quality: 86 } : { quality: 82, effort: 6 }).toFile(output)
  console.log(`${output}: ${(await fs.stat(output)).size} bytes`)
}
