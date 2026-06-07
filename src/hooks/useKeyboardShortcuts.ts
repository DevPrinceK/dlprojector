import { useEffect } from "react";
import { useAppStore } from "../stores/app.store";
import { useProjectionStore } from "../stores/projection.store";
import { openProjectionWindow } from "../lib/projection-window";
import { useSettingsStore } from "../stores/settings.store";

export function useKeyboardShortcuts() {
  const setActiveView = useAppStore((state) => state.setActiveView);
  const pushToast = useAppStore((state) => state.pushToast);
  const projectPreview = useProjectionStore((state) => state.projectPreview);
  const showBlank = useProjectionStore((state) => state.showBlank);
  const showLogo = useProjectionStore((state) => state.showLogo);
  const restorePrevious = useProjectionStore((state) => state.restorePrevious);
  const preferences = useSettingsStore((state) => state.preferences);

  useEffect(() => {
    const onKeyDown = async (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;

      if (event.ctrlKey && event.key.toLowerCase() === "f") {
        event.preventDefault();
        setActiveView("scriptures");
        window.setTimeout(() => document.querySelector<HTMLInputElement>("[data-search-input]")?.focus(), 30);
        return;
      }

      if (event.ctrlKey && event.key.toLowerCase() === "o") {
        event.preventDefault();
        const status = await openProjectionWindow();
        pushToast({ kind: "success", title: "Projection window opened", description: status });
        return;
      }

      if (event.ctrlKey && event.key.toLowerCase() === "p") {
        event.preventDefault();
        await projectPreview();
        pushToast({ kind: "success", title: "Projected selected content" });
        return;
      }

      if (isTyping) return;

      if (matchesShortcut(event, preferences.shortcutNext) || event.key === "ArrowRight") {
        event.preventDefault();
        await projectPreview();
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        await restorePrevious();
        return;
      }

      if (matchesShortcut(event, preferences.shortcutBlank)) {
        event.preventDefault();
        await showBlank();
        return;
      }

      if (matchesShortcut(event, preferences.shortcutLogo)) {
        event.preventDefault();
        await showLogo();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [preferences, projectPreview, pushToast, restorePrevious, setActiveView, showBlank, showLogo]);
}

function matchesShortcut(event: KeyboardEvent, configured: string) {
  const normalized = configured.trim().toLowerCase();
  if (normalized === "space") return event.key === " ";
  return event.key.toLowerCase() === normalized;
}
