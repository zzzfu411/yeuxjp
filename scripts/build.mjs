import { spawnSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { appDir, withBuildLock } from "./build-lock.mjs"

const blockedBuildWarnings = [
  /Image with src ".+?" has "fill" prop and "sizes" prop of "100vw"/,
  /Image with src ".+?" was detected as the Largest Contentful Paint \(LCP\)\. Please add the `loading="eager"` property/,
]

export function hasBlockedBuildWarning(output) {
  return blockedBuildWarnings.some((warning) => warning.test(output))
}

export async function runBuild() {
  return withBuildLock(() => {
    const nextCli = path.join(appDir, "node_modules", "next", "dist", "bin", "next")
    const result = spawnSync(process.execPath, [nextCli, "build"], {
      cwd: appDir,
      encoding: "utf8",
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
    })

    if (result.error) throw result.error

    if (result.stdout) process.stdout.write(result.stdout)
    if (result.stderr) process.stderr.write(result.stderr)

    if ((result.status ?? 1) !== 0) return result.status ?? 1

    const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`
    if (hasBlockedBuildWarning(output)) {
      console.error("[build] Blocked production build because Next.js reported an actionable image performance warning.")
      return 1
    }

    return 0
  }, { label: "npm run build" })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const status = await runBuild()
  process.exit(status)
}
