import { ProjectionPreview } from "../../components/preview/ProjectionPreview";
import { ProjectionControls } from "../../components/layout/ProjectionControls";
import { Sidebar } from "../../components/layout/Sidebar";
import { ToastRegion } from "../../components/common/ToastRegion";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { useAppStore } from "../../stores/app.store";
import { AnnouncementsPage } from "./AnnouncementsPage";
import { DashboardPage } from "./DashboardPage";
import { HymnsPage } from "./HymnsPage";
import { MediaLibraryPage } from "./MediaLibraryPage";
import { PersonalityPage } from "./PersonalityPage";
import { ScripturesPage } from "./ScripturesPage";
import { ServiceProgramPage } from "./ServiceProgramPage";
import { SettingsPage } from "./SettingsPage";

export function ControlApp() {
  useKeyboardShortcuts();
  const activeView = useAppStore((state) => state.activeView);

  return (
    <div className="operator-bg flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <ProjectionControls />
        <main className="safe-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-6 xl:px-8">
          {activeView === "dashboard" ? <DashboardPage /> : null}
          {activeView === "scriptures" ? <ScripturesPage /> : null}
          {activeView === "hymns" ? <HymnsPage /> : null}
          {activeView === "announcements" ? <AnnouncementsPage /> : null}
          {activeView === "personality" ? <PersonalityPage /> : null}
          {activeView === "service" ? <ServiceProgramPage /> : null}
          {activeView === "media" ? <MediaLibraryPage /> : null}
          {activeView === "settings" ? <SettingsPage /> : null}
        </main>
      </div>
      <ProjectionPreview />
      <ToastRegion />
    </div>
  );
}
