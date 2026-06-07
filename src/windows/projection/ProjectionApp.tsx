import { useEffect, useState, type CSSProperties } from "react";
import { listenProjectionContent } from "../../lib/events";
import { invokeCommand, isTauriRuntime } from "../../lib/tauri";
import { LOGO_CONTENT, type ProjectionContent } from "../../types/projection";
import { ErrorBoundary } from "../../components/common/ErrorBoundary";
import { ProjectionRenderer } from "./ProjectionRenderer";
import { useSettingsStore } from "../../stores/settings.store";

export function ProjectionApp() {
  const preferences = useSettingsStore((state) => state.preferences);
  const [content, setContent] = useState<ProjectionContent>(LOGO_CONTENT);
  const [lastValidContent, setLastValidContent] = useState<ProjectionContent>(LOGO_CONTENT);

  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;

    if (isTauriRuntime()) {
      void invokeCommand<ProjectionContent | null>("get_current_projection_content")
        .then((restoredContent) => {
          if (disposed || !restoredContent || restoredContent.type === "blank") return;
          setContent(restoredContent);
          if (restoredContent.type !== "loader") {
            setLastValidContent(restoredContent);
          }
        })
        .catch(() => undefined);
    }

    listenProjectionContent((nextContent) => {
      if (disposed) return;
      setContent(nextContent);
      if (nextContent.type !== "blank" && nextContent.type !== "loader") {
        setLastValidContent(nextContent);
      }
    })
      .then((unlisten) => {
        cleanup = unlisten;
      })
      .catch(() => {
        setContent(LOGO_CONTENT);
      });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return (
    <main
      className={`projection-bg projection-bg-${preferences.background} transition-${preferences.transition} min-h-screen cursor-none overflow-hidden text-white`}
      style={{ "--projection-font-size": `${preferences.fontSize}px` } as CSSProperties}
    >
      <ErrorBoundary fallback={<ProjectionRenderer content={lastValidContent} preferences={preferences} />}>
        <ProjectionRenderer content={content} preferences={preferences} />
      </ErrorBoundary>
    </main>
  );
}
