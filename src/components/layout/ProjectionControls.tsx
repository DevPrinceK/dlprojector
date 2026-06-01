import { ChevronLeft, Maximize2, MonitorUp, RotateCcw, ScreenShareOff, Sparkles } from "lucide-react";
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
    await tryInvokeCommand("open_projection_window", undefined, () => {
      window.open(`${window.location.origin}/?window=projection`, "dlprojector-projection", "popup,width=1280,height=720");
    });
    pushToast({ kind: "success", title: "Projection window opened" });
  };

  const fullscreen = async () => {
    await tryInvokeCommand("set_projection_fullscreen", { fullscreen: true }, async () => undefined);
    pushToast({ kind: "info", title: "Fullscreen command sent" });
  };

  return (
    <div className="sticky top-0 z-30 border-b border-white/70 bg-white/[0.76] px-4 py-3 backdrop-blur-xl lg:px-8">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="default" size="sm" onClick={() => void openProjection()}>
          <MonitorUp className="h-4 w-4" />
          Open Projection
        </Button>
        <Button variant="outline" size="sm" onClick={() => void fullscreen()}>
          <Maximize2 className="h-4 w-4" />
          Fullscreen
        </Button>
        <Button variant="outline" size="sm" onClick={() => void showLogo()}>
          <Sparkles className="h-4 w-4" />
          Logo
        </Button>
        <Button variant="outline" size="sm" onClick={() => void showBlank()}>
          <ScreenShareOff className="h-4 w-4" />
          Blank
        </Button>
        <Button variant="outline" size="sm" onClick={() => void restorePrevious()}>
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <Button variant="secondary" size="sm" onClick={() => void showLoader()}>
          Loader
        </Button>
        <Button variant="danger" size="sm" onClick={() => void emergencyReset()}>
          <RotateCcw className="h-4 w-4" />
          Emergency Reset
        </Button>
        <div className="ml-auto hidden text-xs text-muted-foreground md:block">
          Shortcuts: Space project, B blank, L logo, Ctrl+F search
        </div>
      </div>
    </div>
  );
}
