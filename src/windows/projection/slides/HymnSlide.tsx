import type { ProjectionContent } from "../../../types/projection";
import { SlideFrame } from "./SlideFrame";

interface HymnSlideProps {
  content: ProjectionContent;
  preview?: boolean;
}

export function HymnSlide({ content, preview }: HymnSlideProps) {
  return (
    <SlideFrame preview={preview}>
      <article className="mx-auto max-w-6xl text-center">
        {content.subtitle ? <div className={preview ? "mb-2 text-sm text-gold-100" : "mb-3 text-gold-100"}>{content.subtitle}</div> : null}
        {content.title ? (
          <h1 className={preview ? "projection-text mb-4 text-2xl font-black" : "projection-text mb-[clamp(1.5rem,4vw,3rem)] text-[clamp(3rem,6vw,6.5rem)] font-black"}>{content.title}</h1>
        ) : null}
        <p className={preview ? "projection-text whitespace-pre-line text-xl font-semibold leading-relaxed" : "projection-text whitespace-pre-line text-[clamp(2.2rem,4.8vw,5.25rem)] font-semibold leading-tight"}>
          {content.body || "Content will appear here."}
        </p>
      </article>
    </SlideFrame>
  );
}
