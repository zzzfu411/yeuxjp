import { spawnSync } from "node:child_process"
import path from "node:path"

import { appDir, withBuildLock } from "./build-lock.mjs"

const status = await withBuildLock(() => {
  const nextCli = path.join(appDir, "node_modules", "next", "dist", "bin", "next")
  const result = spawnSync(process.execPath, [nextCli, "build"], {
    cwd: appDir,
    stdio: "inherit",
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
  })

  if (result.error) throw result.error
  return result.status ?? 1
}, { label: "npm run build" })

process.exit(status)
