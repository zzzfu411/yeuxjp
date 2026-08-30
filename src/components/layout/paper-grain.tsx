export function PaperGrain() {
  return (
    <>
      <svg className="pointer-events-none fixed h-0 w-0" aria-hidden focusable="false">
        <defs>
          <filter id="roughen" x="-4%" y="-4%" width="108%" height="108%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012 0.014"
              numOctaves="2"
              seed="7"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="3.4"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>
      <div className="paper-grain" aria-hidden />
      <div className="paper-vignette" aria-hidden />
    </>
  )
}
