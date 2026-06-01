import { useEffect } from "react";
import { useAppStore } from "../../stores/app.store";
import { cn } from "../../lib/utils";

export function ToastRegion() {
  const toasts = useAppStore((state) => state.toasts);
  const removeToast = useAppStore((state) => state.removeToast);

  useEffect(() => {
    const timers = toasts.map((toast) => window.setTimeout(() => removeToast(toast.id), 4600));
    return () => timers.forEach(window.clearTimeout);
  }, [removeToast, toasts]);

  return (
    <div className="fixed right-5 top-5 z-50 flex w-96 max-w-[calc(100vw-2rem)] flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "rounded-2xl border bg-white/95 p-4 shadow-soft backdrop-blur",
            toast.kind === "error" && "border-red-200",
            toast.kind === "success" && "border-emerald-200",
            toast.kind === "warning" && "border-amber-200"
          )}
        >
          <div className="text-sm font-bold">{toast.title}</div>
          {toast.description ? <div className="mt-1 text-sm text-muted-foreground">{toast.description}</div> : null}
        </div>
      ))}
    </div>
  );
}
