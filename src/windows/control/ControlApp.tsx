import { useEffect, useState } from "react";
import { ToastRegion } from "../../components/common/ToastRegion";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { ControlConsole } from "./ControlConsole";
import { LoaderSlide } from "../projection/slides/LoaderSlide";
import { useSettingsStore } from "../../stores/settings.store";
import { useProjectionStore } from "../../stores/projection.store";
import { checkForUpdates } from "../../features/updates/update.api";
import { useAppStore } from "../../stores/app.store";

export function ControlApp() {
  useKeyboardShortcuts();
  const settingsLoaded = useSettingsStore((state) => state.loaded);
  const loaderText = useSettingsStore((state) => state.preferences.loaderText);
  const [minimumSplashElapsed, setMinimumSplashElapsed] = useState(false);
  const restoreLastContent = useProjectionStore((state) => state.restoreLastContent);
  const pushToast = useAppStore((state) => state.pushToast);

  useEffect(() => {
    void restoreLastContent();
  }, [restoreLastContent]);

  useEffect(() => {
    const lastCheck = Number(localStorage.getItem("dlprojector:last-update-check") || 0);
    if (Date.now() - lastCheck < 24 * 60 * 60 * 1000) return;
    localStorage.setItem("dlprojector:last-update-check", String(Date.now()));
    void checkForUpdates()
      .then((status) => {
        if (status.updateAvailable) {
          pushToast({
            kind: "info",
            title: `DL Projector ${status.latestVersion} is available`,
            description: "Open Settings to download the latest release."
          });
        }
      })
      .catch(() => undefined);
  }, [pushToast]);

  useEffect(() => {
    const timer = window.setTimeout(() => setMinimumSplashElapsed(true), 650);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      <ControlConsole />
      <ToastRegion />
      {!settingsLoaded || !minimumSplashElapsed ? (
        <div className="fixed inset-0 z-[100] bg-navy-900 text-white">
          <LoaderSlide title={loaderText} subtitle="Preparing your projection workspace..." />
        </div>
      ) : null}
    </>
  );
}
