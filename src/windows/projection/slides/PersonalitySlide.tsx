import type { ProjectionContent } from "../../../types/projection";
import { SlideFrame } from "./SlideFrame";
import { mediaSource } from "../../../lib/media";

interface PersonalitySlideProps {
  content: ProjectionContent;
  preview?: boolean;
}

export function PersonalitySlide({ content, preview }: PersonalitySlideProps) {
  return (
    <SlideFrame preview={preview}>
      <article className={preview ? "grid items-center gap-4" : "grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]"}>
        <div className={preview ? "projection-card mx-auto hidden aspect-[4/5] w-full max-w-[8rem] items-center justify-center overflow-hidden rounded-xl sm:flex" : "projection-card mx-auto flex aspect-[4/5] w-full max-w-md items-center justify-center overflow-hidden rounded-xl"}>
          {content.imagePath ? (
            <img src={mediaSource(content.imagePath)} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="text-center">
              <div className={preview ? "mx-auto mb-2 h-12 w-12 rounded-full bg-gold-300/20" : "mx-auto mb-4 h-24 w-24 rounded-full bg-gold-300/20"} />
              <p className={preview ? "text-sm font-bold text-white/60" : "text-xl font-bold text-white/60"}>Photo</p>
            </div>
          )}
        </div>
        <div>
          <div className={preview ? "mb-3 inline-flex rounded-full border border-gold-300/40 bg-gold-300/10 px-3 py-1 text-sm text-gold-100" : "mb-5 inline-flex rounded-full border border-gold-300/40 bg-gold-300/10 px-5 py-2 text-gold-100"}>
            Personality of the Week
          </div>
          <h1 className={preview ? "projection-text text-2xl font-black leading-tight text-white" : "projection-text text-[clamp(3.25rem,7vw,7.5rem)] font-black leading-none"}>{content.title}</h1>
          {content.subtitle ? <p className={preview ? "mt-2 text-base leading-snug text-gold-100" : "mt-8 text-3xl text-gold-100"}>{content.subtitle}</p> : null}
          {content.reference ? (
            <p className={preview ? "mt-2 text-sm text-white/80" : "mt-8 text-2xl text-white/80"}>{content.reference}</p>
          ) : null}
          {content.body ? (
            <p className={preview ? "projection-text mt-3 line-clamp-4 text-sm leading-relaxed text-white/75" : "projection-text mt-[clamp(1.5rem,4vw,3rem)] text-[clamp(1.75rem,3.5vw,3.75rem)] leading-tight"}>{content.body}</p>
          ) : null}
        </div>
      </article>
    </SlideFrame>
  );
}
