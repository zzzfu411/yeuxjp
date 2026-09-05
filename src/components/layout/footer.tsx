import Link from "next/link"

export function Footer() {
  return (
    <footer className="site-footer">
      <p>Yasashi Japanese <span>· {new Date().getFullYear()}</span></p>
      <Link href="/settings">数据备份与设置</Link>
    </footer>
  )
}
