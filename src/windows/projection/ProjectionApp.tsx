import { useEffect, useState } from "react";
import { listenProjectionContent } from "../../lib/events";
import { invokeCommand, isTauriRuntime } from "../../lib/tauri";
import { LOGO_CONTENT, type ProjectionContent } from "../../types/projection";
import { ErrorBoundary } from "../../components/common/ErrorBoundary";
import { ProjectionRenderer } from "./ProjectionRenderer";

export function ProjectionApp() {
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
    <main className="projection-bg min-h-screen cursor-none overflow-hidden text-white">
      <ErrorBoundary fallback={<ProjectionRenderer content={lastValidContent} />}>
        <ProjectionRenderer content={content} />
      </ErrorBoundary>
    </main>
  );
}
