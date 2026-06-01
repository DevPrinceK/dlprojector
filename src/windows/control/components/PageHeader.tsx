import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
      <div className="min-w-0 max-w-5xl">
        {eyebrow ? <div className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-gold-700">{eyebrow}</div> : null}
        <h1 className="max-w-4xl text-3xl font-black leading-tight tracking-tight text-navy-900 lg:text-4xl">{title}</h1>
        <p className="mt-2 max-w-4xl text-sm leading-relaxed text-muted-foreground lg:text-base">{description}</p>
      </div>
      {action ? <div className="max-w-full shrink-0 overflow-x-auto pb-1">{action}</div> : null}
    </div>
  );
}
