import type { ProjectionContent } from "../../../types/projection";
import { SlideFrame } from "./SlideFrame";
import { mediaSource } from "../../../lib/media";

interface AnnouncementSlideProps {
  content: ProjectionContent;
  preview?: boolean;
}

export function AnnouncementSlide({ content, preview }: AnnouncementSlideProps) {
  return (
    <SlideFrame preview={preview}>
      <article className={preview ? "grid items-center gap-4" : "grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]"}>
        <div>
          <div className={preview ? "mb-3 inline-flex rounded-full border border-gold-300/40 bg-gold-300/10 px-3 py-1 text-sm text-gold-100" : "mb-5 inline-flex rounded-full border border-gold-300/40 bg-gold-300/10 px-5 py-2 text-gold-100"}>
            Announcement
          </div>
          <h1 className={preview ? "projection-text text-3xl font-black" : "projection-text text-[clamp(3.25rem,7vw,7.5rem)] font-black leading-none"}>{content.title}</h1>
          {content.subtitle ? <p className={preview ? "mt-4 text-lg text-gold-100" : "mt-8 text-3xl text-gold-100"}>{content.subtitle}</p> : null}
          <p className={preview ? "projection-text mt-4 whitespace-pre-line text-lg leading-relaxed" : "projection-text mt-[clamp(1.5rem,4vw,3rem)] whitespace-pre-line text-[clamp(2rem,4vw,4.25rem)] leading-tight"}>
            {content.body}
          </p>
        </div>
        <div className={preview ? "projection-card hidden aspect-[4/3] items-center justify-center overflow-hidden rounded-xl sm:flex" : "projection-card flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl"}>
          {content.imagePath ? (
            <img src={mediaSource(content.imagePath)} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="px-8 text-center text-2xl font-bold text-white/60">DLCF Legon</div>
          )}
        </div>
      </article>
    </SlideFrame>
  );
}
