import { useEffect } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { useAppStore } from "../../stores/app.store";
import { cn } from "../../lib/utils";
import type { ToastKind } from "../../types/common";

const toastMeta: Record<ToastKind, { icon: typeof CheckCircle2; accent: string; glow: string; label: string }> = {
  success: {
    icon: CheckCircle2,
    accent: "from-emerald-300 via-teal-300 to-cyan-300",
    glow: "shadow-emerald-950/30",
    label: "Success"
  },
  info: {
    icon: Info,
    accent: "from-sky-300 via-blue-300 to-indigo-300",
    glow: "shadow-blue-950/30",
    label: "Info"
  },
  warning: {
    icon: AlertTriangle,
    accent: "from-amber-200 via-yellow-300 to-orange-300",
    glow: "shadow-amber-950/30",
    label: "Attention"
  },
  error: {
    icon: XCircle,
    accent: "from-rose-300 via-red-300 to-orange-300",
    glow: "shadow-red-950/30",
    label: "Error"
  }
};

export function ToastRegion() {
  const toasts = useAppStore((state) => state.toasts);
  const removeToast = useAppStore((state) => state.removeToast);

  useEffect(() => {
    const timers = toasts.map((toast) => window.setTimeout(() => removeToast(toast.id), toast.kind === "error" ? 4200 : 2600));
    return () => timers.forEach(window.clearTimeout);
  }, [removeToast, toasts]);

  return (
    <div className="fixed right-5 top-5 z-[70] flex w-[26rem] max-w-[calc(100vw-2rem)] flex-col gap-3">
      {toasts.map((toast) => {
        const meta = toastMeta[toast.kind];
        const Icon = meta.icon;
        return (
          <div
            key={toast.id}
            className={cn(
              "relative overflow-hidden rounded-xl border border-white/10 bg-slate-950/92 p-3 text-white shadow-2xl backdrop-blur-2xl",
              meta.glow
            )}
          >
            <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", meta.accent)} />
            <div className="flex items-start gap-3">
              <div className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-slate-950", meta.accent)}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-slate-500">{meta.label}</div>
                <div className="mt-0.5 text-sm font-black leading-snug">{toast.title}</div>
                {toast.description ? <div className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-400">{toast.description}</div> : null}
              </div>
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-xs font-black text-slate-500 transition hover:bg-white/10 hover:text-white"
                onClick={() => removeToast(toast.id)}
                aria-label="Dismiss notification"
              >
                Close
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
