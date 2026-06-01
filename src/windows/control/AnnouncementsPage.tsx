import { useEffect, useState, type ReactNode } from "react";
import { Edit3, Megaphone, Trash2 } from "lucide-react";
import {
  createAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
  updateAnnouncement
} from "../../features/announcements/announcement.api";
import { announcementToProjection } from "../../features/announcements/announcement.utils";
import { toErrorMessage } from "../../lib/error-handling";
import { required, validateImagePath } from "../../lib/validators";
import { useAppStore } from "../../stores/app.store";
import { useProjectionStore } from "../../stores/projection.store";
import type { Announcement } from "../../types/announcement";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";
import { Modal } from "../../components/ui/modal";
import { EmptyState } from "../../components/common/EmptyState";
import { PageHeader } from "./components/PageHeader";

export function AnnouncementsPage() {
  const pushToast = useAppStore((state) => state.pushToast);
  const setPreviewContent = useProjectionStore((state) => state.setPreviewContent);
  const projectContent = useProjectionStore((state) => state.projectContent);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    message: "",
    eventDate: "",
    eventTime: "",
    venue: "",
    imagePath: "",
    category: ""
  });

  const reload = async () => {
    try {
      setIsLoading(true);
      setAnnouncements(await listAnnouncements());
    } catch (error) {
      pushToast({ kind: "error", title: "Could not load announcements", description: toErrorMessage(error) });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const reset = () => {
    setEditingId(null);
    setForm({ title: "", message: "", eventDate: "", eventTime: "", venue: "", imagePath: "", category: "" });
    setIsFormOpen(false);
  };

  const save = async () => {
    if (isSaving) return;
    const titleError = required(form.title, "Title");
    const messageError = required(form.message, "Message");
    const imageError = validateImagePath(form.imagePath);
    if (titleError || messageError || imageError) {
      pushToast({ kind: "warning", title: titleError ?? messageError ?? imageError ?? "Check announcement form" });
      return;
    }

    try {
      setIsSaving(true);
      const input = { ...form, isActive: true };
      const saved = editingId ? await updateAnnouncement(editingId, input) : await createAnnouncement(input);
      setPreviewContent(announcementToProjection(saved));
      pushToast({ kind: "success", title: editingId ? "Announcement updated" : "Announcement created" });
      reset();
      await reload();
    } catch (error) {
      pushToast({ kind: "error", title: "Could not save announcement", description: toErrorMessage(error) });
    } finally {
      setIsSaving(false);
    }
  };

  const edit = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setIsFormOpen(true);
    setForm({
      title: announcement.title,
      message: announcement.message,
      eventDate: announcement.eventDate ?? "",
      eventTime: announcement.eventTime ?? "",
      venue: announcement.venue ?? "",
      imagePath: announcement.imagePath ?? "",
      category: announcement.category ?? ""
    });
  };

  const remove = async (announcement: Announcement) => {
    await deleteAnnouncement(announcement.id);
    pushToast({ kind: "info", title: "Announcement archived" });
    await reload();
  };

  return (
    <section>
      <PageHeader
        eyebrow="Announcements"
        title="Slides without PowerPoint"
        description="Create clear announcement slides with date, time, venue, category, and optional imagery."
        action={
          <Button
            variant="gold"
            onClick={() => {
              reset();
              setIsFormOpen(true);
            }}
          >
            New Announcement
          </Button>
        }
      />

      <div className="grid gap-5">
        <Card className="dl-glass">
          <CardHeader>
            <CardTitle>Active Announcements</CardTitle>
            <CardDescription>{isLoading ? "Loading announcements..." : `${announcements.length} announcement(s)`}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {announcements.length === 0 ? (
              <EmptyState title="No announcements" description="Create an announcement slide using the form." />
            ) : (
              announcements.map((announcement) => (
                <div key={announcement.id} className="rounded-xl border border-border bg-white/[0.72] p-4">
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => setPreviewContent(announcementToProjection(announcement))}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 font-black">
                          <Megaphone className="h-4 w-4 text-gold-700" />
                          {announcement.title}
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{announcement.message}</p>
                      </div>
                      {announcement.category ? <Badge>{announcement.category}</Badge> : null}
                    </div>
                  </button>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="gold" size="sm" onClick={() => void projectContent(announcementToProjection(announcement))}>
                      Project
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => edit(announcement)}>
                      <Edit3 className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => void remove(announcement)}>
                      <Trash2 className="h-4 w-4" />
                      Archive
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Modal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        title={editingId ? "Edit Announcement" : "Create Announcement"}
        description="Keep text concise and readable from the back of the auditorium."
        footer={
          <>
            <Button variant="outline" onClick={reset} disabled={isSaving}>
              Cancel
            </Button>
            <Button variant="gold" onClick={() => void save()} disabled={isSaving}>
              {isSaving ? "Saving..." : editingId ? "Update Announcement" : "Create Announcement"}
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <Field label="Title">
            <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </Field>
          <Field label="Message">
            <Textarea value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Date">
              <Input type="date" value={form.eventDate} onChange={(event) => setForm({ ...form, eventDate: event.target.value })} />
            </Field>
            <Field label="Time">
              <Input type="time" value={form.eventTime} onChange={(event) => setForm({ ...form, eventTime: event.target.value })} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Venue">
              <Input value={form.venue} onChange={(event) => setForm({ ...form, venue: event.target.value })} />
            </Field>
            <Field label="Category">
              <Input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
            </Field>
          </div>
          <Field label="Image path">
            <Input value={form.imagePath} onChange={(event) => setForm({ ...form, imagePath: event.target.value })} />
          </Field>
        </div>
      </Modal>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
