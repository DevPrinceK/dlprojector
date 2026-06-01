interface LoaderSlideProps {
  subtitle?: string;
  preview?: boolean;
}

const letters = "DLCF Legon".split("");

export function LoaderSlide({ subtitle = "Preparing Projection...", preview }: LoaderSlideProps) {
  return (
    <section className={preview ? "projection-bg relative flex min-h-[16rem] items-center justify-center overflow-hidden rounded-xl text-white" : "projection-bg relative flex min-h-screen items-center justify-center overflow-hidden text-white"}>
      <div className="absolute inset-y-0 left-1/2 w-20 -translate-x-1/2 animate-light-sweep bg-white/10 blur-2xl" />
      <div className="relative z-10 text-center">
        <div className={preview ? "mx-auto mb-4 h-14 w-14 rounded-full border border-gold-300/40 bg-gold-300/10 p-2" : "mx-auto mb-8 h-24 w-24 rounded-full border border-gold-300/40 bg-gold-300/10 p-3"}>
          <div className="h-full w-full animate-loader-pulse rounded-full border-2 border-gold-300/70" />
        </div>
        <h1 className={preview ? "text-4xl font-black tracking-tight" : "text-7xl font-black tracking-tight"}>
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
