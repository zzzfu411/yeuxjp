import assert from "node:assert/strict"
import test from "node:test"
import { setTimeout as delay } from "node:timers/promises"
import { createServerController } from "../e2e/harness.mjs"

test("E2E cleanup terminates its actual listening child before releasing the build lock", async () => {
  const controller = createServerController()
  let released = false
  const server = controller.spawn(process.execPath, ["-e", `
    const server = require('node:http').createServer((req, res) => res.end('ready'));
    server.listen(0, '127.0.0.1', () => console.log('port:' + server.address().port));
  `], { stdio: "pipe", windowsHide: true })
  controller.holdRelease(() => {
    assert.ok(server.exitCode !== null || server.signalCode !== null, "child must exit before lock release")
    released = true
  })
  try {
    for (let attempt = 0; attempt < 100 && !controller.output.includes("port:"); attempt++) await delay(25)
    const match = controller.output.match(/port:(\d+)/)
    assert.ok(match, "fixture server should listen on an OS-assigned port")
    const url = `http://127.0.0.1:${match[1]}`
    assert.equal(await (await fetch(url)).text(), "ready")
    await controller.stop()
    assert.equal(released, true)
    await assert.rejects(fetch(url), "stopped server must no longer accept requests")
  } finally {
    await controller.stop()
  }
})
