import { useEffect, useState } from "react";
import { BookOpen, CalendarDays, Megaphone, Music, Sparkles } from "lucide-react";
import { listAnnouncements } from "../../features/announcements/announcement.api";
import { listHymns } from "../../features/hymns/hymn.api";
import { getRecentScriptures } from "../../features/scriptures/scripture.api";
import { getActiveServiceProgram } from "../../features/service-program/service-program.api";
import { useAppStore } from "../../stores/app.store";
import type { ScriptureSearchResult } from "../../types/scripture";
import type { ServiceProgram } from "../../types/service-program";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { PageHeader } from "./components/PageHeader";

export function DashboardPage() {
  const setActiveView = useAppStore((state) => state.setActiveView);
  const pushToast = useAppStore((state) => state.pushToast);
  const [hymnCount, setHymnCount] = useState(0);
  const [announcementCount, setAnnouncementCount] = useState(0);
  const [recentScriptures, setRecentScriptures] = useState<ScriptureSearchResult[]>([]);
  const [program, setProgram] = useState<ServiceProgram | null>(null);

  useEffect(() => {
    void Promise.all([listHymns(), listAnnouncements(), getRecentScriptures(), getActiveServiceProgram()]).then(
      ([hymns, announcements, scriptures, activeProgram]) => {
        setHymnCount(hymns.length);
        setAnnouncementCount(announcements.length);
        setRecentScriptures(scriptures);
        setProgram(activeProgram);
      }
    ).catch((error) => {
      pushToast({ kind: "error", title: "Could not load dashboard data", description: error instanceof Error ? error.message : "Dashboard data failed to load." });
    });
  }, [pushToast]);

  return (
    <section>
      <PageHeader
        eyebrow="Control Window"
        title="Ready for service"
        description="Quickly prepare and project scriptures, hymns, announcements, personalities, and the order of service from one stable operator dashboard."
      />

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        <StatCard icon={Music} label="Hymns" value={hymnCount.toString()} />
        <StatCard icon={Megaphone} label="Announcements" value={announcementCount.toString()} />
        <StatCard icon={BookOpen} label="Recent Scriptures" value={recentScriptures.length.toString()} />
        <StatCard icon={CalendarDays} label="Service Items" value={(program?.items.length ?? 0).toString()} />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="dl-glass">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Jump straight to the most common live-service workflows.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Button className="justify-start" variant="outline" onClick={() => setActiveView("scriptures")}>
              <BookOpen className="h-4 w-4" />
              Search Scripture
            </Button>
            <Button className="justify-start" variant="outline" onClick={() => setActiveView("hymns")}>
              <Music className="h-4 w-4" />
              Project Hymn
            </Button>
            <Button className="justify-start" variant="outline" onClick={() => setActiveView("announcements")}>
              <Megaphone className="h-4 w-4" />
              Announcements
            </Button>
            <Button className="justify-start" variant="outline" onClick={() => setActiveView("personality")}>
              <Sparkles className="h-4 w-4" />
              Personality
            </Button>
          </CardContent>
        </Card>

        <Card className="dl-glass">
          <CardHeader>
            <CardTitle>Today&apos;s Service Program</CardTitle>
            <CardDescription>{program?.title ?? "No active service program yet."}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(program?.items ?? []).slice(0, 6).map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg bg-white/70 px-4 py-3 text-sm">
                  <span className="font-semibold">{item.title}</span>
                  <Badge>{item.itemType}</Badge>
                </div>
              ))}
            </div>
            <Button className="mt-4 w-full" variant="gold" onClick={() => setActiveView("service")}>
              Open Service Program
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Music; label: string; value: string }) {
  return (
    <Card className="dl-glass">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-900 text-gold-300">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-3xl font-black leading-none">{value}</div>
          <div className="mt-1 break-words text-sm leading-snug text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}
