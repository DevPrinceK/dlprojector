import { useEffect, useState } from "react";
import { ControlApp } from "./windows/control/ControlApp";
import { ProjectionApp } from "./windows/projection/ProjectionApp";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { LoaderSlide } from "./windows/projection/slides/LoaderSlide";
import { isTauriRuntime } from "./lib/tauri";

type WindowMode = "control" | "projection" | "detecting";

function hasProjectionRoute() {
  const params = new URLSearchParams(window.location.search);
  return params.get("window") === "projection" || window.location.hash === "#projection";
}

export function App() {
  const [windowMode, setWindowMode] = useState<WindowMode>(() => {
    if (hasProjectionRoute()) return "projection";
    return isTauriRuntime() ? "detecting" : "control";
  });

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
    <ErrorBoundary fallback={<LoaderSlide subtitle="Recovering display..." />}>
      {windowMode === "detecting" ? <LoaderSlide subtitle="Loading window..." /> : null}
      {windowMode === "projection" ? <ProjectionApp /> : null}
      {windowMode === "control" ? <ControlApp /> : null}
    </ErrorBoundary>
  );
}
