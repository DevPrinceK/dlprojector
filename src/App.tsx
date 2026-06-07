import { useEffect, useState } from "react";
import { ControlApp } from "./windows/control/ControlApp";
import { ProjectionApp } from "./windows/projection/ProjectionApp";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { LoaderSlide } from "./windows/projection/slides/LoaderSlide";
import { isTauriRuntime } from "./lib/tauri";
import { useSettingsStore } from "./stores/settings.store";
import { listenSettingsChanged } from "./features/settings/settings.api";

type WindowMode = "control" | "projection" | "detecting";

function hasProjectionRoute() {
  const params = new URLSearchParams(window.location.search);
  return params.get("window") === "projection" || window.location.hash === "#projection";
}

export function App() {
  const loadSettings = useSettingsStore((state) => state.load);
  const applySettings = useSettingsStore((state) => state.apply);
  const loaderText = useSettingsStore((state) => state.preferences.loaderText);
  const [windowMode, setWindowMode] = useState<WindowMode>(() => {
    if (hasProjectionRoute()) return "projection";
    return isTauriRuntime() ? "detecting" : "control";
  });

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    void listenSettingsChanged(applySettings).then((unlisten) => {
      cleanup = unlisten;
    });
    return () => cleanup?.();
  }, [applySettings]);

  useEffect(() => {
    if (windowMode !== "detecting") return;

    let disposed = false;

    void import("@tauri-apps/api/window")
      .then(({ getCurrentWindow }) => {
        if (disposed) return;
        setWindowMode(getCurrentWindow().label === "projection" ? "projection" : "control");
      })
      .catch(() => {
        if (!disposed) setWindowMode("control");
      });

    return () => {
      disposed = true;
    };
  }, [windowMode]);

  return (
    <ErrorBoundary fallback={<LoaderSlide title={loaderText} subtitle="Recovering display..." />}>
      {windowMode === "detecting" ? <LoaderSlide title={loaderText} subtitle="Loading window..." /> : null}
      {windowMode === "projection" ? <ProjectionApp /> : null}
      {windowMode === "control" ? <ControlApp /> : null}
    </ErrorBoundary>
  );
}
