import type { LessonStudy } from "@/data/coursebook/types"
import type { GoalPracticeTask } from "@/lib/goal-practice"
import type { WritingTask } from "@/lib/written-work-model"

export function lessonWritingTask(lessonId: string, study: LessonStudy): WritingTask {
  const order = Number(lessonId.match(/^day-(\d+)-/)?.[1])
  const checks = order > 0 && order <= 21 ? [
    "我逐个读出了本课目标假名，并对照声音检查长音、小っ或ん的拍数；不适用的项目已注明。",
    "我尝试了任务中的问候或短表达，记录了仍读不准的字或需要再听的声音。",
  ] : study.unitNumber <= 18 ? [
    "我写明了任务要求的人物、时间、地点或数量；不需要的信息没有生硬添加。",
    "我检查了助词、动词形式和先后顺序，并按说话对象选择了合适的礼貌程度。",
  ] : study.unitNumber <= 27 ? [
    "我交代了自己的观点或行动，并用理由、转折或条件把句子连成一段。",
    "我保留了材料中的人物、时间与限制，区分已知事实和自己的推测。",
  ] : [
    "我用材料中的具体依据支持判断，并说明不同方案或立场之间的关系。",
    "我保留了结论的范围和确定程度，没有把部分、可能或试行改写成全部、必然或永久。",
  ]
  return { id: `lesson:${lessonId}`, title: `${study.unitTitle} · ${study.goal}`, prompt: study.task,
    criteria: [`我完成了本课目标：${study.goal}`, ...checks] }
}
export function goalWritingTask(task: GoalPracticeTask): WritingTask {
  return { id: `goal:${task.id}`, title: task.title, prompt: task.instruction,
    criteria: ["我实际尝试了任务，并在上方记录了自己的表达或思考。", task.selfCheck] }
}
