export function Footer() {
  return (
    <footer className="mt-14 border-t border-border/30 py-9">
      <div className="paper-wrap flex flex-col items-center gap-2 text-center">
        <span className="seal-stamp text-lg">優</span>
        <p className="text-sm text-muted-foreground">
          優しい <span className="font-scribble">Yasashi Japanese</span>
        </p>
        <p className="font-scribble text-sm text-muted-foreground">
          paper, ink, and a little practice · {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  )
}
