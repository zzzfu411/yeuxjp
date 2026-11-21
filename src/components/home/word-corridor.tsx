import Image from "next/image"

// Cleaned version of the user's original anime frame.
// Lesson content remains accessible outside this decorative image.
export function WordCorridor() {
  return (
    <div className="corridor-world" aria-hidden="true">
      <Image
        className="corridor-illustration"
        src="/assets/visual-novel/original-corridor-clean.webp"
        alt=""
        width={1586}
        height={992}
        unoptimized
        sizes="(max-width: 1023px) calc(100vw - 36px), (max-width: 1280px) 68vw, 814px"
        loading="eager"
        fetchPriority="high"
      />
    </div>
  )
}
