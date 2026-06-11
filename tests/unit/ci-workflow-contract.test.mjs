import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")
const workflowPath = path.join(root, ".github/workflows/quality.yml")

test("GitHub Actions workflow runs merge and release quality gates", () => {
  assert.equal(fs.existsSync(workflowPath), true)

  const workflow = fs.readFileSync(workflowPath, "utf8")

  assert.match(workflow, /name: Quality Gates/)
  assert.match(workflow, /pull_request:/)
  assert.match(workflow, /push:/)
  assert.match(workflow, /workflow_dispatch:/)
  assert.match(workflow, /release:/)
  assert.match(workflow, /actions\/checkout@v4/)
  assert.match(workflow, /actions\/setup-node@v4/)
  assert.match(workflow, /node-version: 20/)
  assert.match(workflow, /cache-dependency-path: package-lock\.json/)
  assert.match(workflow, /run: npm ci/)
  assert.match(workflow, /run: npm run check/)
  assert.match(workflow, /run: npm run e2e:install/)
  assert.match(workflow, /run: npm run check:release/)
  assert.match(workflow, /github\.event_name != 'workflow_dispatch' \|\| !inputs\.release/)
  assert.match(workflow, /github\.event_name == 'workflow_dispatch' && inputs\.release/)
})
