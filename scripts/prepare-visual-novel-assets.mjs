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
] }
const assets = assetSets[process.argv[3] ?? "original"]
if (!assets) throw new Error("Asset set must be original, megumi or manga")
await fs.mkdir("public/assets/visual-novel", { recursive: true })
await fs.mkdir("output/imagegen/visual-novel", { recursive: true })
for (const [source, name] of assets) {
  const input = path.join(sourceRoot, source)
  await fs.copyFile(input, `output/imagegen/visual-novel/${name}-original.png`)
  const output = `public/assets/visual-novel/${name}.webp`
  await sharp(input).resize({ width: 1536, withoutEnlargement: true }).webp(name === "megumi-manga" ? { quality: 86 } : { quality: 82, effort: 6 }).toFile(output)
  console.log(`${output}: ${(await fs.stat(output)).size} bytes`)
}
