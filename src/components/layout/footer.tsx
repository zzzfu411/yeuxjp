export function Footer() {
  return (
    <footer className="border-t-[3px] border-foreground py-8">
      <div className="container mx-auto flex flex-col items-center gap-3 px-4 text-center">
        <span className="font-brush text-accent border-2 border-accent/70 px-2 py-0.5 -rotate-3 text-lg">
          優しい
        </span>
        <p className="text-sm font-semibold text-muted-foreground">
          YASASHI! · 纸面日语学习机
        </p>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Yasashi Japanese
        </p>
      </div>
    </footer>
  )
}
