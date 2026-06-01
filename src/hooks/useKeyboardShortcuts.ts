import { useEffect } from "react";
import { useAppStore } from "../stores/app.store";
import { useProjectionStore } from "../stores/projection.store";
import { tryInvokeCommand } from "../lib/tauri";

export function useKeyboardShortcuts() {
  const setActiveView = useAppStore((state) => state.setActiveView);
  const pushToast = useAppStore((state) => state.pushToast);
  const projectPreview = useProjectionStore((state) => state.projectPreview);
  const showBlank = useProjectionStore((state) => state.showBlank);
  const showLogo = useProjectionStore((state) => state.showLogo);
  const restorePrevious = useProjectionStore((state) => state.restorePrevious);

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
        await tryInvokeCommand("open_projection_window", undefined, () => {
          window.open(`${window.location.origin}/?window=projection`, "dlprojector-projection", "popup,width=1280,height=720");
        });
        pushToast({ kind: "success", title: "Projection window opened" });
        return;
      }

      if (event.ctrlKey && event.key.toLowerCase() === "p") {
        event.preventDefault();
        await projectPreview();
        pushToast({ kind: "success", title: "Projected selected content" });
        return;
      }

      if (isTyping) return;

      if (event.key === " " || event.key === "ArrowRight") {
        event.preventDefault();
        await projectPreview();
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        await restorePrevious();
        return;
      }

      if (event.key.toLowerCase() === "b") {
        event.preventDefault();
        await showBlank();
        return;
      }

      if (event.key.toLowerCase() === "l") {
        event.preventDefault();
        await showLogo();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [projectPreview, pushToast, restorePrevious, setActiveView, showBlank, showLogo]);
}
