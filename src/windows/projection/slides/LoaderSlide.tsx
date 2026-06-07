interface LoaderSlideProps {
  title?: string;
  subtitle?: string;
  preview?: boolean;
}

export function LoaderSlide({ title = "DLCF Legon", subtitle = "Preparing Projection...", preview }: LoaderSlideProps) {
  const letters = title.split("");
  const titleSize = title.length > 24
    ? preview ? "text-2xl" : "text-5xl"
    : preview ? "text-4xl" : "text-7xl";
  return (
    <section className={preview ? "projection-bg relative flex min-h-[16rem] items-center justify-center overflow-hidden rounded-xl text-white" : "projection-bg relative flex min-h-screen items-center justify-center overflow-hidden text-white"}>
      <div className="absolute inset-y-0 left-1/2 w-20 -translate-x-1/2 animate-light-sweep bg-white/10 blur-2xl" />
      <div className="relative z-10 text-center">
        <div className={preview ? "mx-auto mb-4 h-14 w-14 rounded-full border border-gold-300/40 bg-gold-300/10 p-2" : "mx-auto mb-8 h-24 w-24 rounded-full border border-gold-300/40 bg-gold-300/10 p-3"}>
          <div className="h-full w-full animate-loader-pulse rounded-full border-2 border-gold-300/70" />
        </div>
        <h1 className={`mx-auto max-w-[90vw] break-words font-black tracking-tight ${titleSize}`}>
          {letters.map((letter, index) => (
            <span
              key={`${letter}-${index}`}
              className="inline-block animate-fade-in"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              {letter === " " ? "\u00A0" : letter}
            </span>
          ))}
        </h1>
        <p className={preview ? "mt-3 text-base text-gold-100" : "mt-6 text-2xl text-gold-100"}>{subtitle}</p>
      </div>
    </section>
  );
}
