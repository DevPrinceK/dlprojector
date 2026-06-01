import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "./button";
import { cn } from "../../lib/utils";

interface ModalProps {
  title: string;
  description?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function Modal({ title, description, open, onOpenChange, children, footer, className }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/70 p-4 backdrop-blur-md">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          "operator-bg max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-xl border border-white/70 shadow-soft ring-1 ring-navy-900/10",
          className
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/70 bg-white/[0.78] px-5 py-4 backdrop-blur-xl">
          <div className="min-w-0">
            <div className="mb-1 text-[0.65rem] font-black uppercase tracking-[0.24em] text-gold-700">DL Projector</div>
            <h2 id="modal-title" className="text-xl font-black text-navy-900">
              {title}
            </h2>
            {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
          </div>
          <Button className="shrink-0 bg-white/80" variant="ghost" size="icon" onClick={() => onOpenChange(false)} aria-label="Close modal">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="safe-scrollbar max-h-[calc(90vh-9rem)] overflow-y-auto bg-white/[0.58] px-5 py-4 backdrop-blur-sm">
          {children}
        </div>
        {footer ? (
          <div className="flex flex-wrap justify-end gap-2 border-t border-white/70 bg-white/[0.78] px-5 py-4 backdrop-blur-xl">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
