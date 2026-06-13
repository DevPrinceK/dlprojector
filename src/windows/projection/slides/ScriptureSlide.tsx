import type { ProjectionContent } from "../../../types/projection";
import { SlideFrame } from "./SlideFrame";

interface ScriptureSlideProps {
  content: ProjectionContent;
  preview?: boolean;
  showVersion?: boolean;
  referencePosition?: "top" | "bottom";
}

export function ScriptureSlide({ content, preview, showVersion = true, referencePosition = "top" }: ScriptureSlideProps) {
  const reference = (
    <div className={preview ? "mx-auto mb-3 inline-flex rounded-full border border-gold-300/40 bg-gold-300/10 px-3 py-1 text-sm text-gold-100" : "mx-auto mb-[clamp(1rem,3vw,2rem)] inline-flex rounded-full border border-gold-300/40 bg-gold-300/10 px-5 py-2 text-gold-100"}>
      {content.reference ?? content.title ?? "Scripture"}
    </div>
  );
  return (
    <SlideFrame preview={preview}>
      <article className="projection-card rounded-xl p-[clamp(1rem,3vw,3rem)] text-center">
        {referencePosition === "top" ? reference : null}
        <p className={preview ? "projection-text line-clamp-5 whitespace-pre-line text-lg font-semibold leading-relaxed text-white" : "projection-text whitespace-pre-line text-[clamp(2.3rem,5.3vw,5.5rem)] font-semibold leading-tight"}>
          {content.body || "Scripture text will appear here."}
        </p>
        {content.subtitle && showVersion ? (
          <div className={preview ? "mt-6 text-sm text-white/70" : "mt-10 text-2xl text-white/70"}>{content.subtitle}</div>
        ) : null}
        {referencePosition === "bottom" ? <div className="mt-6">{reference}</div> : null}
      </article>
    </SlideFrame>
  );
}
