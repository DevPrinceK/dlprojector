import {
  CalendarDays,
  Church,
  Gauge,
  Image,
  Megaphone,
  Music,
  Settings,
  Sparkles,
  UsersRound
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAppStore, type ControlView } from "../../stores/app.store";

const navItems: Array<{ id: ControlView; label: string; icon: typeof Gauge }> = [
  { id: "dashboard", label: "Dashboard", icon: Gauge },
  { id: "scriptures", label: "Scriptures", icon: Church },
  { id: "hymns", label: "Hymns", icon: Music },
  { id: "announcements", label: "Announcements", icon: Megaphone },
  { id: "personality", label: "Personality", icon: Sparkles },
  { id: "service", label: "Service Program", icon: CalendarDays },
  { id: "media", label: "Media Library", icon: Image },
  { id: "settings", label: "Settings", icon: Settings }
];

export function Sidebar() {
  const activeView = useAppStore((state) => state.activeView);
  const setActiveView = useAppStore((state) => state.setActiveView);

  return (
    <aside className="hidden h-screen w-72 shrink-0 border-r border-white/70 bg-navy-900 px-4 py-5 text-white lg:flex lg:flex-col">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-300 text-lg font-black text-navy-900">
          DL
        </div>
        <div>
          <div className="text-lg font-black">DL Projector</div>
          <div className="text-xs text-gold-100">DLCF Legon</div>
        </div>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveView(item.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold transition",
                isActive ? "bg-white text-navy-900 shadow" : "text-white/[0.74] hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto rounded-3xl border border-white/10 bg-white/[0.08] p-4 text-sm text-white/[0.72]">
        <UsersRound className="mb-3 h-5 w-5 text-gold-300" />
        Built for live service: quick, calm, offline, and projection-safe.
      </div>
    </aside>
  );
}
