import fs from "node:fs"
import { loadTsModule } from "../tests/unit/load-ts-module.mjs"

const { STARTER_LESSONS } = await loadTsModule("src/data/lessons.ts")
const { COURSE_UNITS } = await loadTsModule("src/data/coursebook/index.ts")
const lines = [
  "# 日语课程目录与学习任务", "",
  "本目录从应用教材数据生成。35 个主题单元、175 课；每单元五课共用一组对话与课文，每课有独立目标、讲解、理解题和表达任务。等级为教学参考，不是官方完整考纲或固定天数的达标承诺。", "",
  "## 学习方法", "",
  "每课按目标与讲解 → 例句与单元情境 → 语言练习与理解题 → 开放表达与自查进行。建议基础阶段每课约 25 分钟，之后依次 30、35、40 分钟，可按个人节奏分次完成。这是本站学习安排，不是达到 JLPT 等级所需的总学时。", "",
  "初学阶段可以对照中文、词汇读音和设备朗读理解整体情境，不要求一开始独立认识课文全部假名。中级尝试先读日文，再用中文辅助核对。高阶重点保留观点来源、范围、时态与确定程度。", "",
  "课后先独立写或说，再看示范，检查信息、语言形式和语气。第二天先回忆；每隔一个单元再回顾。选择题分数与真实表达能力分别看待。", "",
  "## 单元总览", "", "| 单元 | 课序 | 主题 | 课文 |", "| --- | --- | --- | --- |",
  ...COURSE_UNITS.map((unit, index) => `| ${index + 1} | ${unit.start}–${unit.start + 4} | ${unit.title} | ${unit.readingTitle} |`),
  "", "## 逐课目标与作品", "",
]
for (const [index, unit] of COURSE_UNITS.entries()) {
  lines.push(`### 单元 ${index + 1}：${unit.title}`, "", unit.scene, "")
  for (let offset = 0; offset < 5; offset++) {
    const lesson = STARTER_LESSONS[unit.start + offset - 1]
    const [goal, , task] = unit.focuses[offset]
    lines.push(`- **第 ${lesson.order} 课：${goal}**。作品：${task} 对应路由：\`/learn/${lesson.id}\`。`)
  }
  lines.push("")
}
lines.push("## 材料与评价范围", "", "对话、课文与题目是项目原创教学材料；新闻和调查中的情节、数字为虚构练习设定。设备朗读属于合成语音，尚不包含真人录音、口语自动评分或母语教师审校。课程不替代官方样题、实际交流与外部听力材料；完整调研依据见同目录 COURSE-REDESIGN-2026-09-08.md。", "")
fs.writeFileSync("docs/COURSE-OUTLINE.md", lines.join("\n"))
const stats = {
  lessons: STARTER_LESSONS.length,
  steps: STARTER_LESSONS.reduce((n, lesson) => n + lesson.steps.length, 0),
  practiceSteps: STARTER_LESSONS.reduce((n, lesson) => n + lesson.steps.filter(step => "itemId" in step).length, 0),
  originalReadings: COURSE_UNITS.length,
  dialogueLines: COURSE_UNITS.reduce((n, unit) => n + unit.dialogue.length, 0),
  contextualWordEntries: COURSE_UNITS.reduce((n, unit) => n + unit.words.length, 0),
  readingLengthByStage: [1, 46, 91, 136].map((start, index, starts) => {
    const units = COURSE_UNITS.filter(unit => unit.start >= start && unit.start < (starts[index + 1] ?? 176))
    const lengths = units.map(unit => unit.reading.length)
    return { start, min: Math.min(...lengths), max: Math.max(...lengths) }
  }),
}
console.log(JSON.stringify(stats, null, 2))
