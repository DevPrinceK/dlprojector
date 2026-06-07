import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock,
  Image,
  Keyboard,
  Maximize2,
  Megaphone,
  MonitorUp,
  Moon,
  Music2,
  PanelTopOpen,
  Plus,
  Radio,
  RotateCcw,
  Search,
  Settings,
  SkipBack,
  SkipForward,
  Sparkles,
  UserRound,
  X,
  Zap
} from "lucide-react";
import { listAnnouncements } from "../../features/announcements/announcement.api";
import { announcementToProjection } from "../../features/announcements/announcement.utils";
import { searchHymns } from "../../features/hymns/hymn.api";
import { hymnToProjection } from "../../features/hymns/hymn.utils";
import { listPersonalities } from "../../features/personalities/personality.api";
import { personalityToProjection } from "../../features/personalities/personality.utils";
import { searchScriptures } from "../../features/scriptures/scripture.api";
import { scriptureResultToProjection } from "../../features/scriptures/scripture.utils";
import { getActiveServiceProgram } from "../../features/service-program/service-program.api";
import { openProjectionWindow } from "../../lib/projection-window";
import { tryInvokeCommand } from "../../lib/tauri";
import { useAppStore, type ControlView } from "../../stores/app.store";
import { useProjectionStore } from "../../stores/projection.store";
import { useSettingsStore } from "../../stores/settings.store";
import type { ProjectionContent } from "../../types/projection";
import type { ServiceProgram } from "../../types/service-program";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { ProjectionRenderer } from "../projection/ProjectionRenderer";
import { AnnouncementsPage } from "./AnnouncementsPage";
import { HymnsPage } from "./HymnsPage";
import { MediaLibraryPage } from "./MediaLibraryPage";
import { PersonalityPage } from "./PersonalityPage";
import { ScripturesPage } from "./ScripturesPage";
import { ServiceProgramPage } from "./ServiceProgramPage";
import { SettingsPage } from "./SettingsPage";

interface CommandResult {
  id: string;
  title: string;
  meta: string;
  icon: typeof BookOpen;
  content: ProjectionContent;
}

const workspaceLabels: Record<Exclude<ControlView, "dashboard">, string> = {
  scriptures: "Scriptures",
  hymns: "Hymns",
  announcements: "Announcements",
  personality: "Personality",
  service: "Service Program",
  media: "Media Library",
  settings: "Settings"
};

const dockItems: Array<{ view?: ControlView; label: string; icon: typeof BookOpen; action?: "blank" | "logo" | "loader" }> = [
  { view: "scriptures", label: "Scripture", icon: BookOpen },
  { view: "hymns", label: "Hymn", icon: Music2 },
  { view: "announcements", label: "Announce", icon: Megaphone },
  { view: "personality", label: "Person", icon: UserRound },
  { view: "service", label: "Service", icon: CalendarDays },
  { view: "media", label: "Media", icon: Image },
  { label: "Blank", icon: Moon, action: "blank" },
  { label: "Logo", icon: MonitorUp, action: "logo" },
  { view: "settings", label: "Setup", icon: Settings }
];

export function ControlConsole() {
  const activeView = useAppStore((state) => state.activeView);
  const setActiveView = useAppStore((state) => state.setActiveView);
  const pushToast = useAppStore((state) => state.pushToast);
  const previewContent = useProjectionStore((state) => state.previewContent);
  const currentContent = useProjectionStore((state) => state.currentContent);
  const setPreviewContent = useProjectionStore((state) => state.setPreviewContent);
  const projectPreview = useProjectionStore((state) => state.projectPreview);
  const showBlank = useProjectionStore((state) => state.showBlank);
  const showLogo = useProjectionStore((state) => state.showLogo);
  const showLoader = useProjectionStore((state) => state.showLoader);
  const restorePrevious = useProjectionStore((state) => state.restorePrevious);
  const emergencyReset = useProjectionStore((state) => state.emergencyReset);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CommandResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [program, setProgram] = useState<ServiceProgram | null>(null);
  const [stagedServiceItemId, setStagedServiceItemId] = useState<number | null>(null);
  const [liveServiceItemId, setLiveServiceItemId] = useState<number | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadActiveProgram = (event?: Event) => {
      const selectedProgram = event instanceof CustomEvent ? (event.detail as ServiceProgram | undefined) : undefined;
      if (selectedProgram) {
        setProgram(selectedProgram);
        return;
      }

      void getActiveServiceProgram()
        .then(setProgram)
        .catch((error) => {
          pushToast({
            kind: "error",
            title: "Could not load service timeline",
            description: error instanceof Error ? error.message : "Service data failed to load."
          });
        });
    };

    loadActiveProgram();
    window.addEventListener("dl:service-program-changed", loadActiveProgram);
    return () => window.removeEventListener("dl:service-program-changed", loadActiveProgram);
  }, [pushToast]);

  useEffect(() => {
    const searchTerm = query.trim();
    let cancelled = false;

    async function runSearch() {
      setIsSearching(true);
      try {
        const [scriptures, hymns, announcements, personalities] = await Promise.all([
          searchTerm ? searchScriptures(searchTerm) : searchScriptures("John 3:16"),
          searchHymns(searchTerm),
          listAnnouncements(),
          listPersonalities()
        ]);

        if (cancelled) return;

        const normalized = searchTerm.toLowerCase();
        const announcementMatches = announcements.filter((item) =>
          [item.title, item.message, item.category].some((value) => value?.toLowerCase().includes(normalized))
        );
        const personalityMatches = personalities.filter((item) =>
          [item.fullName, item.department, item.role, item.favoriteScripture].some((value) =>
            value?.toLowerCase().includes(normalized)
          )
        );

        setResults([
          ...scriptures.slice(0, 2).map((item) => ({
            id: `scripture-${item.reference}`,
            title: item.reference,
            meta: `Scripture - ${item.version}`,
            icon: BookOpen,
            content: scriptureResultToProjection(item)
          })),
          ...hymns.slice(0, 2).map((item) => ({
            id: `hymn-${item.id}`,
            title: item.number ? `Hymn ${item.number} - ${item.title}` : item.title,
            meta: `${item.lyricsJson.stanzas.length} stanza hymn`,
            icon: Music2,
            content: hymnToProjection(item)
          })),
          ...announcementMatches.slice(0, 1).map((item) => ({
            id: `announcement-${item.id}`,
            title: item.title,
            meta: item.category ? `Announcement - ${item.category}` : "Announcement",
            icon: Megaphone,
            content: announcementToProjection(item)
          })),
          ...personalityMatches.slice(0, 1).map((item) => ({
            id: `personality-${item.id}`,
            title: item.fullName,
            meta: [item.department, item.role].filter(Boolean).join(" - ") || "Personality",
            icon: UserRound,
            content: personalityToProjection(item)
          }))
        ].slice(0, 6));
      } catch (error) {
        if (!cancelled) {
          pushToast({
            kind: "error",
            title: "Command search failed",
            description: error instanceof Error ? error.message : "Could not search projection items."
          });
        }
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }

    const timeout = window.setTimeout(() => void runSearch(), searchTerm ? 180 : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [query, pushToast]);

  const formattedTime = useMemo(
    () => now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    [now]
  );

  const openProjection = async () => {
    const status = await openProjectionWindow();
    pushToast({ kind: "success", title: "Projection window opened", description: status });
  };

  const fullscreen = async () => {
    await tryInvokeCommand("set_projection_fullscreen", { fullscreen: true }, async () => undefined);
    pushToast({ kind: "info", title: "Fullscreen command sent" });
  };

  const runAction = async (title: string, action: () => Promise<void>) => {
    try {
      await action();
    } catch (error) {
      pushToast({ kind: "error", title, description: error instanceof Error ? error.message : "Action failed." });
    }
  };

  const selectCommand = (result: CommandResult) => {
    setPreviewContent(result.content);
    setQuery("");
    pushToast({ kind: "success", title: "Loaded into preview", description: result.title });
  };

  return (
    <div className="console-shell relative h-screen overflow-hidden bg-[#05050a] text-slate-100">
      <div className="console-aurora" />
      <div className="console-grid" />

      <header className="relative z-20 grid grid-cols-[auto_minmax(320px,1fr)_auto] items-center gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-200 via-amber-400 to-indigo-500 shadow-[0_0_45px_rgba(251,191,36,0.24)]">
            <MonitorUp className="h-5 w-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight text-white">DLCF Legon</h1>
              <Badge className="border-white/10 bg-white/10 text-slate-300">Projection Console</Badge>
            </div>
            <p className="text-xs text-slate-500">Live service production control</p>
          </div>
        </div>

        <CommandCenter
          isSearching={isSearching}
          query={query}
          results={results}
          onQueryChange={setQuery}
          onSelectResult={selectCommand}
        />

        <div className="flex items-center justify-end gap-2">
          <StatusPill />
          <Button
            variant="gold"
            className="h-10 px-5 font-black shadow-[0_0_32px_rgba(251,191,36,0.22)]"
            onClick={() => void openProjection()}
          >
            <MonitorUp className="h-4 w-4" />
            Open Projection Screen
          </Button>
          <Button
            variant="outline"
            className="h-10 border-white/10 bg-white/[0.06] text-slate-300 hover:bg-white/10 hover:text-white"
            onClick={() => void fullscreen()}
          >
            <Maximize2 className="h-4 w-4" />
            Fullscreen
          </Button>
        </div>
      </header>

      <main className="relative z-10 grid h-[calc(100vh-84px)] grid-rows-[1fr_auto_auto] gap-4 px-6 pb-28">
        <div className="grid min-h-0 grid-cols-[minmax(0,1fr)_minmax(280px,340px)] gap-4">
          <section className="grid min-h-0 grid-cols-2 gap-4">
            <ProjectionDeck variant="preview" content={previewContent} />
            <ProjectionDeck variant="live" content={currentContent} />
          </section>

          <UtilityRail
            currentContent={currentContent}
            formattedTime={formattedTime}
            onOpenProjection={openProjection}
            onShowBlank={() => runAction("Could not blank projection", showBlank)}
            onShowLoader={() => runAction("Could not show loader", showLoader)}
            onEmergencyReset={() => runAction("Emergency reset failed", emergencyReset)}
          />
        </div>

        <TakeConsole
          disabled={!previewContent}
          onPrevious={() => runAction("Could not restore previous slide", restorePrevious)}
          onTake={() =>
            runAction("Could not take preview live", async () => {
              await projectPreview();
              if (stagedServiceItemId !== null) setLiveServiceItemId(stagedServiceItemId);
            })
          }
          onNext={() => setActiveView("service")}
        />

        <Timeline
          program={program}
          stagedItemId={stagedServiceItemId}
          liveItemId={liveServiceItemId}
          onAddItem={() => setActiveView("service")}
          onStageItem={(item) => {
            const content = serviceItemToProjection(item);
            setStagedServiceItemId(item.id);
            setPreviewContent(content);
            pushToast({ kind: "success", title: "Loaded service item into preview", description: item.title });
          }}
        />
      </main>

      <BottomDock
        activeView={activeView}
        onChoose={(item) => {
          if (item.action === "blank") void runAction("Could not blank projection", showBlank);
          if (item.action === "logo") void runAction("Could not show logo", showLogo);
          if (item.action === "loader") void runAction("Could not show loader", showLoader);
          if (item.view) setActiveView(item.view);
        }}
      />

      {activeView !== "dashboard" ? (
        <WorkspaceDrawer activeView={activeView} onClose={() => setActiveView("dashboard")} />
      ) : null}
    </div>
  );
}

function CommandCenter({
  isSearching,
  query,
  results,
  onQueryChange,
  onSelectResult
}: {
  isSearching: boolean;
  query: string;
  results: CommandResult[];
  onQueryChange: (query: string) => void;
  onSelectResult: (result: CommandResult) => void;
}) {
  const showResults = query.trim().length > 0 || results.length > 0;

  return (
    <div className="relative mx-auto w-full">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.07] shadow-2xl shadow-black/30 backdrop-blur-2xl">
        <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          className="h-14 border-0 bg-transparent pl-14 pr-28 text-base text-white placeholder:text-slate-500 focus-visible:ring-0"
          placeholder="Search John 3:16, Hymn 45, announcements..."
        />
        <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
          <kbd className="rounded-md border border-white/10 bg-black/30 px-2 py-1 text-[10px] text-slate-400">Ctrl</kbd>
          <kbd className="rounded-md border border-white/10 bg-black/30 px-2 py-1 text-[10px] text-slate-400">K</kbd>
        </div>
      </div>

      {showResults && query.trim() ? (
        <div className="absolute left-0 right-0 top-[4.1rem] z-40 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/96 p-2 shadow-2xl shadow-black/50 backdrop-blur-xl">
          {isSearching ? <div className="px-4 py-3 text-sm text-slate-500">Searching console library...</div> : null}
          {!isSearching && results.length === 0 ? <div className="px-4 py-3 text-sm text-slate-500">No matches yet.</div> : null}
          {results.map((result, index) => {
            const Icon = result.icon;
            return (
              <button
                key={result.id}
                type="button"
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition ${
                  index === 0 ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
                onClick={() => onSelectResult(result)}
              >
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${index === 0 ? "bg-slate-950 text-white" : "bg-white/10"}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold">{result.title}</span>
                  <span className={`block truncate text-xs ${index === 0 ? "text-slate-500" : "text-slate-500"}`}>{result.meta}</span>
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function ProjectionDeck({ variant, content }: { variant: "preview" | "live"; content: ProjectionContent | null }) {
  const isLive = variant === "live";
  const preferences = useSettingsStore((state) => state.preferences);

  return (
    <article
      className={`flex min-h-0 flex-col overflow-hidden rounded-[1.5rem] border-2 backdrop-blur-xl ${
        isLive
          ? "live-deck border-[#22C55E] bg-emerald-950/20 shadow-[0_0_42px_rgba(34,197,94,0.18)]"
          : "preview-deck border-[#F6C445] bg-amber-950/15 shadow-[0_0_38px_rgba(246,196,69,0.16)]"
      }`}
    >
      <div className={`flex items-center justify-between border-b px-4 py-3 ${isLive ? "border-emerald-400/25 bg-emerald-400/[0.07]" : "border-amber-300/25 bg-amber-300/[0.07]"}`}>
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isLive ? "bg-emerald-400/15 text-emerald-200" : "bg-amber-400/15 text-amber-200"}`}>
            {isLive ? <Radio className="h-5 w-5" /> : <PanelTopOpen className="h-5 w-5" />}
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">{isLive ? "Live Output" : "Preview Deck"}</p>
            <h2 className="text-sm font-bold text-white">{isLive ? "Congregation Screen" : "Ready to Take"}</h2>
          </div>
        </div>
        <Badge className={`border-white/10 ${isLive ? "bg-emerald-400/15 text-emerald-200" : "bg-amber-400/15 text-amber-200"}`}>
          {isLive ? <span className="live-status-dot mr-1.5 h-2 w-2 rounded-full bg-emerald-300" /> : null}
          {isLive ? "LIVE" : "STAGED"}
        </Badge>
      </div>

      <div className="min-h-0 flex-1 p-3">
        <div className="projection-bg h-full overflow-hidden rounded-2xl shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
          {content ? <ProjectionRenderer content={content} preview preferences={preferences} /> : <EmptyDeck />}
        </div>
      </div>
    </article>
  );
}

function EmptyDeck() {
  return (
    <div className="flex h-full items-center justify-center text-center text-slate-400">
      <div>
        <Sparkles className="mx-auto mb-3 h-7 w-7 text-amber-200" />
        <p className="font-bold text-white">Nothing staged</p>
        <p className="mt-1 text-sm">Search or choose a dock item to prepare content.</p>
      </div>
    </div>
  );
}

function TakeConsole({
  disabled,
  onPrevious,
  onTake,
  onNext
}: {
  disabled: boolean;
  onPrevious: () => void;
  onTake: () => void;
  onNext: () => void;
}) {
  return (
    <section className="flex items-center justify-center gap-4">
      <Button variant="outline" className="h-12 border-white/10 bg-white/[0.06] px-5 text-slate-300 hover:bg-white/10 hover:text-white" onClick={onPrevious}>
        <SkipBack className="h-5 w-5" />
        Previous
      </Button>
      <button
        type="button"
        disabled={disabled}
        onClick={onTake}
        className="take-live-button group relative h-16 min-w-[260px] overflow-hidden rounded-2xl bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 px-10 text-lg font-black tracking-[0.18em] text-slate-950 shadow-[0_0_60px_rgba(251,191,36,0.32)] transition hover:shadow-[0_0_90px_rgba(251,191,36,0.45)] disabled:cursor-not-allowed disabled:opacity-45"
      >
        <span className="take-live-sweep absolute inset-0 bg-gradient-to-r from-transparent via-white/45 to-transparent" />
        <span className="relative flex items-center justify-center gap-3">
          <Zap className="h-5 w-5 fill-slate-950" />
          TAKE LIVE
        </span>
      </button>
      <Button variant="outline" className="h-12 border-white/10 bg-white/[0.06] px-5 text-slate-300 hover:bg-white/10 hover:text-white" onClick={onNext}>
        Service
        <SkipForward className="h-5 w-5" />
      </Button>
    </section>
  );
}

function Timeline({
  program,
  stagedItemId,
  liveItemId,
  onAddItem,
  onStageItem
}: {
  program: ServiceProgram | null;
  stagedItemId: number | null;
  liveItemId: number | null;
  onAddItem: () => void;
  onStageItem: (item: ServiceProgram["items"][number]) => void;
}) {
  const items = program?.items ?? [];

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.055] p-4 shadow-2xl shadow-black/20 backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-5 w-5 text-amber-200" />
          <div>
            <h3 className="text-sm font-bold text-white">{program?.title ?? "Sunday Service Timeline"}</h3>
            <p className="text-xs text-slate-500">Past fades, staged glows, live takes center.</p>
          </div>
        </div>
        <Button variant="outline" className="h-9 border-white/10 bg-white/[0.06] text-slate-300 hover:bg-white/10 hover:text-white" onClick={onAddItem}>
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      <div className="safe-scrollbar flex max-w-full gap-3 overflow-x-auto pb-2">
        {(items.length ? items : fallbackTimeline).map((item, index) => {
          const isLive = "itemType" in item ? item.id === liveItemId || (liveItemId === null && index === 0) : index === 0;
          const isStaged = "itemType" in item && item.id === stagedItemId;
          const isDone = false;
          const title = item.title;
          const type = "itemType" in item ? item.itemType : item.type;

          return (
            <button
              key={`${index}-${title}`}
              type="button"
              onClick={() => {
                if ("itemType" in item) onStageItem(item);
              }}
              className={`relative min-w-[190px] overflow-hidden rounded-2xl border p-3 text-left transition ${
                isStaged
                  ? "border-amber-200 bg-amber-300/15 shadow-[0_0_44px_rgba(251,191,36,0.24)] ring-2 ring-amber-200/35"
                  : isLive
                  ? "timeline-live-item border-emerald-300/40 bg-emerald-400/10 shadow-[0_0_40px_rgba(16,185,129,0.12)]"
                  : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.05]"
              } ${isDone ? "opacity-45" : "opacity-100"}`}
            >
              {isStaged ? <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500" /> : null}
              <div className="mb-3 flex items-center justify-between">
                <span className={isStaged ? "text-xs font-bold text-amber-100" : "text-xs font-bold text-slate-500"}>
                  {program?.serviceDate?.slice(5) ?? "Today"}
                </span>
                {isStaged ? <PanelTopOpen className="h-4 w-4 text-amber-200" /> : isLive ? <Radio className="h-4 w-4 text-emerald-300" /> : <Circle className="h-4 w-4 text-slate-600" />}
              </div>
              <p className="truncate text-sm font-black text-white">{title}</p>
              <p className="mt-1 truncate text-xs text-slate-500">{type}</p>
              <Badge className={`mt-3 border-white/10 ${isStaged ? "bg-amber-300 text-slate-950" : isLive ? "bg-emerald-400/15 text-emerald-200" : "bg-white/10 text-slate-400"}`}>
                {isStaged ? "Staged" : isLive ? "Live" : type}
              </Badge>
            </button>
          );
        })}
      </div>
    </section>
  );
}

const fallbackTimeline = [
  { title: "Opening Prayer", type: "Service" },
  { title: "Hymn", type: "Hymn" },
  { title: "Scripture Reading", type: "Scripture" },
  { title: "Announcements", type: "Announcement" }
];

function serviceItemToProjection(item: ServiceProgram["items"][number]): ProjectionContent {
  if (item.customContentJson) return item.customContentJson;
  if (item.itemType === "blank") return { type: "blank" };
  if (item.itemType === "logo") return { type: "logo", title: "DLCF Legon", subtitle: "Deeper Life Campus Fellowship" };
  return { type: "custom", title: item.title, body: "" };
}

function UtilityRail({
  currentContent,
  formattedTime,
  onOpenProjection,
  onShowBlank,
  onShowLoader,
  onEmergencyReset
}: {
  currentContent: ProjectionContent;
  formattedTime: string;
  onOpenProjection: () => Promise<void>;
  onShowBlank: () => void;
  onShowLoader: () => void;
  onEmergencyReset: () => void;
}) {
  const loaderText = useSettingsStore((state) => state.preferences.loaderText);
  const currentTitle =
    currentContent.type === "loader"
      ? loaderText
      : currentContent.title ?? currentContent.reference ?? currentContent.type;

  return (
    <aside className="grid min-h-0 content-start gap-3">
      <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">Output</p>
            <h3 className="font-bold text-white">Display 2</h3>
          </div>
          <MonitorUp className="h-5 w-5 text-emerald-300" />
        </div>
        <div className="space-y-2 text-sm text-slate-400">
          <div className="flex justify-between"><span>Time</span><span className="text-slate-200">{formattedTime}</span></div>
          <div className="flex justify-between"><span>Mode</span><span className="text-slate-200">Extended</span></div>
          <div className="flex justify-between"><span>State</span><span className="text-emerald-300">Stable</span></div>
        </div>
        <Button className="mt-4 w-full font-black" variant="gold" onClick={() => void onOpenProjection()}>
          <MonitorUp className="h-4 w-4" />
          Open Projection Screen
        </Button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">Currently Live</p>
        <h3 className="mt-2 line-clamp-2 font-black text-white">{currentTitle}</h3>
        <p className="mt-2 line-clamp-4 whitespace-pre-line text-sm text-slate-400">{currentContent.body ?? currentContent.subtitle}</p>
      </div>

      <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.06] p-4 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="mb-3 flex items-center gap-2 text-amber-200">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-bold">Safety Actions</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="border-white/10 bg-white/[0.06] text-slate-300 hover:bg-white/10 hover:text-white" onClick={onShowBlank}>
            <Moon className="h-4 w-4" />
            Blank
          </Button>
          <Button variant="outline" className="border-white/10 bg-white/[0.06] text-slate-300 hover:bg-white/10 hover:text-white" onClick={onShowLoader}>
            <Clock className="h-4 w-4" />
            Loader
          </Button>
        </div>
        <Button variant="danger" className="mt-2 w-full" onClick={onEmergencyReset}>
          <RotateCcw className="h-4 w-4" />
          Emergency Reset
        </Button>
      </div>
    </aside>
  );
}

function StatusPill() {
  return (
    <div className="projector-heartbeat flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 shadow-[0_0_30px_rgba(16,185,129,0.12)]">
      <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,0.9)]" />
      Projector Connected
    </div>
  );
}

function BottomDock({
  activeView,
  onChoose
}: {
  activeView: ControlView;
  onChoose: (item: (typeof dockItems)[number]) => void;
}) {
  return (
    <div className="fixed bottom-5 left-1/2 z-30 -translate-x-1/2">
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/85 p-2 shadow-2xl shadow-black/40 backdrop-blur-2xl">
        {dockItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.view === activeView;
          return (
            <button
              key={item.label}
              type="button"
              className={`group flex h-14 w-20 flex-col items-center justify-center gap-1 rounded-xl text-xs font-semibold transition ${
                isActive ? "bg-white text-slate-950 shadow-lg" : "text-slate-400 hover:bg-white/10 hover:text-white"
              }`}
              onClick={() => onChoose(item)}
            >
              <Icon className="h-5 w-5 transition group-hover:scale-110" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WorkspaceDrawer({ activeView, onClose }: { activeView: Exclude<ControlView, "dashboard">; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/78 p-5 backdrop-blur-md">
      <section className="console-shell relative h-full overflow-hidden rounded-2xl border border-white/10 bg-slate-950 text-slate-950 shadow-2xl shadow-black/50">
        <div className="console-aurora opacity-80" />
        <div className="console-grid" />
        <header className="relative z-10 flex items-center justify-between border-b border-white/10 bg-white/[0.06] px-5 py-3 text-white backdrop-blur-2xl">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200">Workspace</p>
            <h2 className="text-xl font-black">{workspaceLabels[activeView]}</h2>
          </div>
          <Button
            className="border-white/10 bg-white/[0.08] text-slate-200 hover:bg-white/15 hover:text-white"
            variant="outline"
            size="icon"
            onClick={onClose}
            aria-label="Close workspace"
          >
            <X className="h-5 w-5" />
          </Button>
        </header>
        <div className="operator-bg safe-scrollbar relative z-10 h-[calc(100%-73px)] overflow-y-auto p-5">
          {activeView === "scriptures" ? <ScripturesPage /> : null}
          {activeView === "hymns" ? <HymnsPage /> : null}
          {activeView === "announcements" ? <AnnouncementsPage /> : null}
          {activeView === "personality" ? <PersonalityPage /> : null}
          {activeView === "service" ? <ServiceProgramPage /> : null}
          {activeView === "media" ? <MediaLibraryPage /> : null}
          {activeView === "settings" ? <SettingsPage /> : null}
        </div>
      </section>
    </div>
  );
}
