import { ChevronLeft, Maximize2, MonitorUp, RotateCcw, ScreenShareOff, Sparkles } from "lucide-react";
import { openProjectionWindow } from "../../lib/projection-window";
import { tryInvokeCommand } from "../../lib/tauri";
import { useAppStore } from "../../stores/app.store";
import { useProjectionStore } from "../../stores/projection.store";
import { Button } from "../ui/button";

export function ProjectionControls() {
  const pushToast = useAppStore((state) => state.pushToast);
  const showLogo = useProjectionStore((state) => state.showLogo);
  const showBlank = useProjectionStore((state) => state.showBlank);
  const showLoader = useProjectionStore((state) => state.showLoader);
  const restorePrevious = useProjectionStore((state) => state.restorePrevious);
  const emergencyReset = useProjectionStore((state) => state.emergencyReset);

  const openProjection = async () => {
    const status = await openProjectionWindow();
    pushToast({ kind: "success", title: "Projection window opened", description: status });
  };

  const fullscreen = async () => {
    await tryInvokeCommand("set_projection_fullscreen", { fullscreen: true }, async () => undefined);
    pushToast({ kind: "info", title: "Fullscreen command sent" });
  };

  const runProjectionAction = async (title: string, action: () => Promise<void>) => {
    try {
      await action();
    } catch (error) {
      pushToast({
        kind: "error",
        title,
        description: error instanceof Error ? error.message : "Projection command failed."
      });
    }
  };

  return (
    <div className="sticky top-0 z-30 border-b border-white/70 bg-white/[0.86] px-4 py-2.5 backdrop-blur-xl lg:px-6 xl:px-8">
      <div className="grid gap-2">
        <div className="flex flex-wrap items-center gap-2">
        <Button className="font-black" variant="default" size="sm" onClick={() => void openProjection()}>
          <MonitorUp className="h-4 w-4" />
          Open Projection
        </Button>
        <Button variant="outline" size="sm" onClick={() => void fullscreen()}>
          <Maximize2 className="h-4 w-4" />
          Fullscreen
        </Button>
        <Button variant="outline" size="sm" onClick={() => void runProjectionAction("Could not show logo", showLogo)}>
          <Sparkles className="h-4 w-4" />
          Logo
        </Button>
        <Button variant="outline" size="sm" onClick={() => void runProjectionAction("Could not blank screen", showBlank)}>
          <ScreenShareOff className="h-4 w-4" />
          Blank
        </Button>
        <Button variant="outline" size="sm" onClick={() => void runProjectionAction("Could not restore previous slide", restorePrevious)}>
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <Button variant="secondary" size="sm" onClick={() => void runProjectionAction("Could not show loader", showLoader)}>
          Loader
        </Button>
        <Button variant="danger" size="sm" onClick={() => void runProjectionAction("Emergency reset failed", emergencyReset)}>
          <RotateCcw className="h-4 w-4" />
          Emergency Reset
        </Button>
        </div>
        <div className="hidden text-right text-xs text-muted-foreground xl:block">
          Shortcuts: Space project, B blank, L logo, Ctrl+F search
        </div>
      </div>
    </div>
  );
}
