import type { Metadata } from "next"

const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://yeuxjp.vercel.app")
if (!["https:", "http:"].includes(siteUrl.protocol)) throw new Error("NEXT_PUBLIC_SITE_URL must be an HTTP(S) site URL")
export const SITE_ORIGIN = siteUrl.origin

export const PUBLIC_ROUTES = [
  { path: "/", title: "今日学习 | 優しい Yasashi", description: "从五十音到 N2，按 175 天课程学习日语，查看每日目标与复习安排。" },
  { path: "/path", title: "175 天学习路径", description: "从假名、基础句型到 N2，循序浏览课程，区分已完成与按基础跳过的内容。" },
  { path: "/kana", title: "五十音与发音", description: "学习平假名、片假名、浊音、拗音与特殊音节，查看笔顺并练习日语发音。" },
  { path: "/vocabulary", title: "日语单词库", description: "按等级、主题和关键词查找单词，通过翻卡、发音和自评巩固日语词汇。" },
  { path: "/grammar", title: "日语语法手册", description: "查找 N5 至 N2 及作品口语中的语法，学习结构、例句并进行专项练习。" },
  { path: "/semantics", title: "日语语义辨析", description: "比较容易混淆的日语表达，通过词义、解释与例句理解用法差异。" },
  { path: "/pragmatics", title: "日语场景与语用", description: "从日常交流场景学习表达方式、礼貌程度与文化背景。" },
  { path: "/quiz", title: "日语专项测验", description: "练习假名、听力、词义、助词与动词活用，及时检查答案并积累错题。" },
  { path: "/review", title: "间隔复习与错题本", description: "复习已到期的假名、单词和错题，按练习表现安排下一次复习。" },
  { path: "/settings", title: "学习设置与数据备份", description: "调整学习目标和朗读偏好，导出或恢复保存在当前浏览器中的学习数据。" },
] as const

export function pageMetadata(path: string, title: string, description: string): Metadata {
  return {
    title, description, alternates: { canonical: path },
    openGraph: { title, description, url: path, locale: "zh_CN", type: "website", siteName: "優しい Yasashi" },
    twitter: { card: "summary", title, description },
  }
}

export function routeMetadata(path: string): Metadata {
  const route = PUBLIC_ROUTES.find(route => route.path === path)
  if (!route) throw new Error("Unknown public route")
  return pageMetadata(path, route.title, route.description)
}
