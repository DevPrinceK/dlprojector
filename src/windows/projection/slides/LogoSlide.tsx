import type { ProjectionContent } from "../../../types/projection";
import { SlideFrame } from "./SlideFrame";

interface LogoSlideProps {
  content?: ProjectionContent;
  preview?: boolean;
}

export function LogoSlide({ content, preview }: LogoSlideProps) {
  return (
    <SlideFrame preview={preview}>
      <div className="mx-auto max-w-4xl text-center">
        <div className="mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-full border border-gold-300/40 bg-white/10 text-4xl font-black text-gold-300 shadow-2xl">
          DL
        </div>
        <h1 className={preview ? "projection-text text-3xl font-black tracking-tight" : "projection-text text-[clamp(4rem,8vw,8rem)] font-black tracking-tight"}>
          {content?.title ?? "DLCF Legon"}
        </h1>
        <p className={preview ? "mt-3 text-lg text-gold-100" : "mt-6 text-3xl text-gold-100"}>
          {content?.subtitle ?? "Deeper Life Campus Fellowship"}
        </p>
      </div>
    </SlideFrame>
  );
}
