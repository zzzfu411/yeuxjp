import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("home page delegates first-run profile setup to OnboardingPanel", () => {
  const page = read("src/app/page.tsx")

  assert.match(page, /from "@\/components\/home\/onboarding-panel"/)
  assert.match(page, /from "@\/components\/practice\/practice-save-error"/)
  assert.match(page, /const \[profileSaveError, setProfileSaveError\] = useState\(false\)/)
  assert.match(page, /const saved = saveProfile\(input\)/)
  assert.match(page, /setProfileSaveError\(!saved\)/)
  assert.match(page, /<PracticeSaveError show=\{profileSaveError\} \/>/)
  assert.doesNotMatch(page, /const goalOptions/)
  assert.doesNotMatch(page, /const kanaOptions/)
  assert.doesNotMatch(page, /const romajiOptions/)
  assert.doesNotMatch(page, /function SelectPills/)
  assert.doesNotMatch(page, /type UserProfile/)
})

test("OnboardingPanel owns profile option state and save payload", () => {
  const source = read("src/components/home/onboarding-panel.tsx")

  assert.match(source, /export function OnboardingPanel/)
  assert.match(source, /onSave: \(input: Omit<UserProfile, "createdAt" \| "updatedAt">\) => boolean/)
  assert.match(source, /const goalOptions/)
  assert.match(source, /const kanaOptions/)
  assert.match(source, /const romajiOptions/)
  assert.match(source, /useState<LearningGoal>\("balanced"\)/)
  assert.match(source, /useState<KanaLevel>\("none"\)/)
  assert.match(source, /useState<RomajiMode>\("practice"\)/)
  assert.match(source, /useState\(10\)/)
  assert.match(source, /onSave\(\{ goal, kanaLevel, romajiMode, minutesPerDay \}\)/)
  assert.match(source, /function SelectPills/)
  assert.match(source, /生成今日计划/)
})
