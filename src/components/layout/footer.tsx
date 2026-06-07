export function Footer() {
  return (
    <footer className="border-t bg-muted/40 py-6 md:py-0">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row px-4">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built with ❤️ for Japanese learners. 
            <span className="mx-2 hidden md:inline">|</span>
            © {new Date().getFullYear()} Yasashi Japanese
          </p>
        </div>
        <p className="text-center text-sm text-muted-foreground">
            让日语学习变得简单温暖
        </p>
      </div>
    </footer>
  )
}
