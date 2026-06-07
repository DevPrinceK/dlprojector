import type { CSSProperties } from "react";
import type { ProjectionContent } from "../../../types/projection";
import { SlideFrame } from "./SlideFrame";

interface HymnSlideProps {
  content: ProjectionContent;
  preview?: boolean;
  showTitle?: boolean;
  scrollSecondsPerLine?: number;
}

export function HymnSlide({ content, preview, showTitle = true, scrollSecondsPerLine = 4.2 }: HymnSlideProps) {
  const lineCount = (content.body || "").split("\n").filter(Boolean).length;
  const shouldScroll = !preview && lineCount > 8;
  const duration = Math.max(20, Math.min(90, lineCount * scrollSecondsPerLine));

  return (
    <SlideFrame preview={preview}>
      <article className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden text-center">
        {content.subtitle ? <div className={preview ? "mb-2 text-sm text-gold-100" : "mb-3 text-gold-100"}>{content.subtitle}</div> : null}
        {content.title && showTitle ? (
          <h1 className={preview ? "projection-text mb-4 text-2xl font-black" : "projection-text mb-[clamp(1.5rem,4vw,3rem)] text-[clamp(3rem,6vw,6.5rem)] font-black"}>
            {content.title}
          </h1>
        ) : null}
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <p
            className={
              preview
                ? "projection-text whitespace-pre-line text-xl font-semibold leading-relaxed"
                : `projection-text whitespace-pre-line text-[clamp(2.2rem,4.8vw,5.25rem)] font-semibold leading-tight ${shouldScroll ? "hymn-autoscroll" : ""}`
            }
            style={shouldScroll ? ({ "--hymn-scroll-duration": `${duration}s` } as CSSProperties) : undefined}
          >
            {content.body || "Content will appear here."}
          </p>
          {shouldScroll ? <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#071426] to-transparent" /> : null}
        </div>
      </article>
    </SlideFrame>
  );
}
