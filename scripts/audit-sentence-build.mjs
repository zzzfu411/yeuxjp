import fs from "node:fs"
import { loadTsModule } from "../tests/unit/load-ts-module.mjs"
const { STARTER_LESSONS } = await loadTsModule("src/data/lessons.ts")
const { getLessonStepVersion } = await loadTsModule("src/lib/lesson-content-fingerprint.ts")
const rows = STARTER_LESSONS.flatMap(lesson => lesson.steps.filter(step => step.type === "sentenceBuild")
  .map(step => ({ key: `${lesson.id}/${step.id}`, day: lesson.order, ...step, sourceVersion: getLessonStepVersion(step) })))
fs.mkdirSync("output", { recursive: true })
fs.writeFileSync("output/sentence-build-inventory.json", JSON.stringify(rows, null, 2))
fs.writeFileSync("output/sentence-build-inventory.txt", rows.map((row, index) => `${index + 1}. D${row.day} ${row.key}\n${row.prompt} / ${row.meaning}\n${row.answer}${row.acceptedAnswers?.length ? ` | ${row.acceptedAnswers.join(" | ")}` : ""}\n[${row.chunks.join(" / ")}]`).join("\n\n"))
console.log(`Inventoried ${rows.length} sentence-build questions.`)
