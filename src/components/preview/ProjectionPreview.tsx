import { ProjectionRenderer } from "../../windows/projection/ProjectionRenderer";
import { useProjectionStore } from "../../stores/projection.store";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useSettingsStore } from "../../stores/settings.store";

export function ProjectionPreview() {
  const previewContent = useProjectionStore((state) => state.previewContent);
  const currentContent = useProjectionStore((state) => state.currentContent);
  const projectPreview = useProjectionStore((state) => state.projectPreview);
  const preferences = useSettingsStore((state) => state.preferences);

  return (
    <aside className="hidden h-screen w-[22rem] shrink-0 overflow-y-auto border-l border-white/70 bg-white/[0.82] p-3 backdrop-blur-xl 2xl:block">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black">Live Preview</h2>
          <p className="text-xs text-muted-foreground">What will go to projection</p>
        </div>
        <Badge>{previewContent?.type ?? "none"}</Badge>
      </div>

      <div className="projection-bg overflow-hidden rounded-xl shadow-soft">
        {previewContent ? <ProjectionRenderer content={previewContent} preview preferences={preferences} /> : null}
      </div>

      <Button className="mt-4 w-full" variant="gold" onClick={() => void projectPreview()}>
        Project Selected
      </Button>

      <div className="mt-6 rounded-xl border border-border bg-white p-4">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Current Output</div>
        <div className="mt-2 text-sm font-bold">{currentContent.title ?? currentContent.reference ?? currentContent.type}</div>
        <p className="mt-2 line-clamp-4 whitespace-pre-line text-sm text-muted-foreground">{currentContent.body}</p>
      </div>
    </aside>
  );
}
