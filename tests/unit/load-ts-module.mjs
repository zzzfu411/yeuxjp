import fs from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"
import ts from "typescript"

const root = path.resolve(import.meta.dirname, "..", "..")
const runId = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`
const cacheDir = path.join(root, ".test-cache", runId)
const loaded = new Set()

function cachePathForRel(relPath) {
  return path.join(cacheDir, relPath.replace(/[\\/]/g, "__").replace(/\.[cm]?tsx?$/, ".mjs"))
}

function resolveImportPath(fromRelPath, specifier) {
  if (specifier.startsWith("@/")) {
    return `src/${specifier.slice(2)}.ts`
  }
  if (specifier.startsWith("../src/")) {
    return `${specifier.slice(3)}.ts`
  }
  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    const baseDir = path.dirname(fromRelPath)
    return path.normalize(path.join(baseDir, `${specifier}.ts`)).replace(/\\/g, "/")
  }
  return null
}

function existingRelPath(candidate) {
  const variants = candidate.endsWith(".ts")
    ? [candidate, candidate.replace(/\.ts$/, ".tsx"), candidate.replace(/\.ts$/, "/index.ts")]
    : [candidate]

  for (const relPath of variants) {
    if (fs.existsSync(path.join(root, relPath))) return relPath
  }

  return null
}

function transpileToCache(relPath) {
  const normalizedRelPath = relPath.replace(/\\/g, "/")
  if (loaded.has(normalizedRelPath)) return cachePathForRel(normalizedRelPath)
  loaded.add(normalizedRelPath)

  const absPath = path.join(root, normalizedRelPath)
  const source = fs.readFileSync(absPath, "utf8")
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      esModuleInterop: true,
      skipLibCheck: true,
    },
    fileName: absPath,
  }).outputText

  fs.mkdirSync(cacheDir, { recursive: true })
  const outPath = cachePathForRel(normalizedRelPath)
  const rewritten = output
    .replaceAll('from "@/lib/', 'from "../src/lib/')
    .replaceAll('from "@/data/', 'from "../src/data/')
    .replaceAll('from "@/components/', 'from "../src/components/')
    .replace(/from "([^"]+)"/g, (match, specifier) => {
      const candidate = resolveImportPath(normalizedRelPath, specifier)
      if (!candidate) return match
      const existing = existingRelPath(candidate)
      if (!existing) return match
      const depOut = transpileToCache(existing)
      const relative = path.relative(path.dirname(outPath), depOut).replace(/\\/g, "/")
      return `from "${relative.startsWith(".") ? relative : `./${relative}`}"`
    })
    .replace(/import\("([^"]+)"\)/g, (match, specifier) => {
      const candidate = resolveImportPath(normalizedRelPath, specifier)
      if (!candidate) return match
      const existing = existingRelPath(candidate)
      if (!existing) return match
      const depOut = transpileToCache(existing)
      const relative = path.relative(path.dirname(outPath), depOut).replace(/\\/g, "/")
      return `import("${relative.startsWith(".") ? relative : `./${relative}`}")`
    })
  fs.writeFileSync(outPath, rewritten)
  return outPath
}

export async function loadTsModule(relPath) {
  const outPath = transpileToCache(relPath)
  return import(pathToFileURL(outPath).href + `?v=${Date.now()}`)
}
