import Link from "next/link"

export default function NotFound() {
  return <section className="paper-wrap max-w-2xl py-16">
    <p className="eyebrow">404</p>
    <h1 className="mt-3 font-brush text-3xl">没有找到这个页面</h1>
    <p className="mt-4 text-muted-foreground">地址可能已变更。可以从学习路径继续，或回到首页查看进度。</p>
    <div className="mt-6 flex flex-wrap gap-3">
      <Link href="/path" className="anime-button anime-button-primary px-4 py-3">查看学习路径</Link>
      <Link href="/" className="anime-button anime-button-outline px-4 py-3">回到首页</Link>
    </div>
  </section>
}
