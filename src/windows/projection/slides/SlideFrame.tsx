import type { ReactNode } from "react";
import { cn } from "../../../lib/utils";

interface SlideFrameProps {
  children: ReactNode;
  preview?: boolean;
  className?: string;
}

export function SlideFrame({ children, preview, className }: SlideFrameProps) {
  return (
    <section
      className={cn(
        "relative flex w-full items-center justify-center overflow-hidden",
        preview ? "min-h-[16rem] rounded-xl p-4" : "min-h-screen p-[clamp(2rem,6vw,6rem)]",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -left-36 top-12 h-96 w-96 rounded-full bg-gold-300/20 blur-3xl" />
        <div className="absolute -right-32 bottom-4 h-[34rem] w-[34rem] rounded-full bg-indigo-500/20 blur-3xl" />
      </div>
      <div className={cn("relative z-10 w-full animate-slide-up", preview ? "max-w-3xl" : "max-w-7xl")}>{children}</div>
    </section>
  );
}
