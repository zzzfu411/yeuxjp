import type { LearningGoal, ReferenceLevel, UserProfile } from "@/lib/learning-progress-types"
import { MEDIA_PRACTICE_TASKS } from "@/data/media-practice"

export type GoalPracticeTask = {
  id: string
  title: string
  instruction: string
  prerequisite: string
  selfCheck: string
  resources: { title: string; href: string }[]
}
export type GoalPracticePlan = { goal: LearningGoal; label: string; description: string; tasks: GoalPracticeTask[] }
const grammarLink = (level: ReferenceLevel, item: string) => `/grammar?level=${level}&item=${encodeURIComponent(item)}`
const LEVELS: ReferenceLevel[] = ["N5", "N4", "N3", "N2"]
export function getAllGoalPracticeTasks() {
  const plans = [getGoalPracticePlan({ goal: "balanced" }), getGoalPracticePlan({ goal: "travel" }), getGoalPracticePlan({ goal: "media" }),
    ...LEVELS.map(level => getGoalPracticePlan({ goal: "media", selfAssessedLevel: level })),
    ...LEVELS.map(level => getGoalPracticePlan({ goal: "jlpt", jlptTarget: level, selfAssessedLevel: level }))]
  return [...new Map(plans.flatMap(plan => plan.tasks).map(task => [task.id, task])).values()]
}
const grammarFocus: Record<ReferenceLevel, [string, string]> = {
  N5: ["n5-wa", "主题与句子骨架"], N4: ["n4-tara", "条件表达"],
  N3: ["n3-you-ni", "目的与结果状态"], N2: ["n2-wake-dewa-nai", "部分否定与立场"],
}

export function getGoalPracticePlan(profile?: Pick<UserProfile, "goal" | "jlptTarget" | "selfAssessedLevel"> | null, mediaLevel?: ReferenceLevel): GoalPracticePlan {
  const goal = profile?.goal ?? "balanced"
  if (goal === "travel") return { goal, label: "旅行实用", description: "主线保持原来的顺序。以下场景可从第一天配合学习，先读示例再尝试自己的表达。", tasks: [
    { id: "travel-order", title: "点餐与结账", prerequisite: "零基础可先跟读固定表达；数量表达可查量词资料。",
      instruction: "你和朋友进店，先要菜单，再点两杯饮料，最后请求结账。尝试说出三个回合。",
      selfCheck: "是否说明了数量？是否把要菜单和结账区分开？",
      resources: [{ title: "要菜单", href: "/pragmatics/p-req-menu" }, { title: "数量与量词", href: grammarLink("N5", "n5-counter") }, { title: "结账", href: "/pragmatics/p-req-check" }] },
    { id: "travel-directions", title: "问清一个地点", prerequisite: "可先学习「どこ」与地点指示词。",
      instruction: "在商场问洗手间的位置，再把目标换成车站。设想对方回答「そこです」，说明它指哪一边。",
      selfCheck: "是否使用地点疑问词？是否能区分ここ、そこ、あそこ？",
      resources: [{ title: "问地点示例", href: "/pragmatics/p-req-toilet" }, { title: "地点指示词与练习", href: grammarLink("N5", "n5-koko") }] },
    { id: "travel-repeat", title: "没听清时继续交流", prerequisite: "零基础可直接跟读，不需要先学完敬语体系。",
      instruction: "售票员说得太快。先请对方再说一次，听完后说出你确认的一条信息。",
      selfCheck: "是否表达了请求重复？是否核对信息而不是只说“はい”？",
      resources: [{ title: "请求重复的表达", href: "/pragmatics/p-req-repeat" }, { title: "听辨长音", href: "/quiz?mode=audio-longvowel" }] },
  ] }
  if (goal === "media") {
    const level = mediaLevel ?? (profile?.selfAssessedLevel && profile.selfAssessedLevel !== "unknown" ? profile.selfAssessedLevel : "N5")
    return { goal, label: `动漫理解 · ${level}`, description: `${level} 原创社团微场景：读台词、找依据，再写自己的回应。${mediaLevel ? "当前按所选阶段查看" : "从自评基础对应的材料开始"}，可随时切换；不用于解锁主线或判定等级。`, tasks: MEDIA_PRACTICE_TASKS[level] }
  }
  if (goal === "jlpt") {
    const target = profile?.jlptTarget ?? "N5"
    const current = profile?.selfAssessedLevel && profile.selfAssessedLevel !== "unknown" ? profile.selfAssessedLevel : "N5"
    const practiceLevel = LEVELS[Math.min(LEVELS.indexOf(target), LEVELS.indexOf(current))] ?? "N5"
    const [point, focus] = grammarFocus[practiceLevel]
    return { goal, label: `JLPT ${target} 准备`, description: `目标 ${target}；基础${profile?.selfAssessedLevel && profile.selfAssessedLevel !== "unknown" ? `自评 ${profile.selfAssessedLevel}` : "尚未定位，先从 N5 练习起步"}。当前提供 ${practiceLevel} 专项；自评不解锁主线，也不代表考试能力。`, tasks: [
      { id: `jlpt-${practiceLevel}-grammar`, title: `${practiceLevel} · ${focus}`, prerequisite: "先读结构和例句，再关闭提示独立答题。",
        instruction: "完成该语法点的专项题。逐项说明正确选项与干扰项的差异；答错后回到解释中寻找依据。",
        selfCheck: "是否依靠语境和结构判断，而不是背选项位置？",
        resources: [{ title: "进入对应语法练习", href: grammarLink(practiceLevel, point) }] },
      { id: `jlpt-${practiceLevel}-words`, title: "巩固词义与读音", prerequisite: "选已接触过的词，先确认读音再测词义。",
        instruction: "从词库选择本阶段的词，检查词义与例句。随后复习到期词，分别关注听音与词义表现。",
        selfCheck: "是否把“见过这个词”和“能独立答对”区分开？",
        resources: [{ title: "阶段词汇", href: `/vocabulary?level=${practiceLevel === "N5" ? "survival" : practiceLevel === "N2" ? "fluent" : "daily"}` }, { title: "到期复习", href: "/review" }] },
      { id: `jlpt-${target}-path`, title: "检查课程证据与薄弱项", prerequisite: "课程等级仅作教学参考，当前专项不是官方模拟考试。",
        instruction: "查看已完成课程的当前测评记录。优先补练未测或错误的题，再进入后续课程。阶段诊断与目标等级需分别判断。",
        selfCheck: "是否还有未经测试的内容？是否把课程完成数误当作等级证明？",
        resources: [{ title: "查看路径与补练", href: "/path" }] },
    ] }
  }
  return { goal: "balanced", label: "均衡推进", description: "主线之外，结合听辨、句型和情境理解。每次选一项即可。", tasks: [
    { id: "balanced-sound", title: "听辨一个发音对比", prerequisite: "先认识假名，再反复听长短音。", instruction: "完成一轮长音对比，解释自己容易混淆的两个词。", selfCheck: "是否听到了长度差异？", resources: [{ title: "长音听辨", href: "/quiz?mode=audio-longvowel" }] },
    { id: "balanced-sentence", title: "检查句子骨架", prerequisite: "能读基本假名，可对照术语解释。", instruction: "练习助词，说明话题、动作对象和地点之间的关系。", selfCheck: "是否能解释助词选择的依据？", resources: [{ title: "助词练习", href: "/quiz?mode=particle" }] },
    { id: "balanced-context", title: "把表达放进场景", prerequisite: "可直接阅读中文说明。", instruction: "查看请求重复的场景，把它放进一次你设想的日常交流。", selfCheck: "是否说明对象、场合和请求内容？", resources: [{ title: "请求重复", href: "/pragmatics/p-req-repeat" }] },
  ] }
}
