import { useEffect, useState, type ReactNode } from "react";
import { Edit3, Sparkles, Trash2 } from "lucide-react";
import {
  createPersonality,
  deletePersonality,
  listPersonalities,
  updatePersonality
} from "../../features/personalities/personality.api";
import { personalityToProjection } from "../../features/personalities/personality.utils";
import { toErrorMessage } from "../../lib/error-handling";
import { required, validateImagePath } from "../../lib/validators";
import { useAppStore } from "../../stores/app.store";
import { useProjectionStore } from "../../stores/projection.store";
import type { Personality } from "../../types/personality";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { ImagePicker } from "../../components/ui/image-picker";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Modal } from "../../components/ui/modal";
import { EmptyState } from "../../components/common/EmptyState";
import { PageHeader } from "./components/PageHeader";
import { useConfirm } from "../../hooks/useConfirm";
import { materializeImage } from "../../features/media/media.api";

export function PersonalityPage() {
  const { confirm, confirmationDialog } = useConfirm();
  const pushToast = useAppStore((state) => state.pushToast);
  const setPreviewContent = useProjectionStore((state) => state.setPreviewContent);
  const projectContent = useProjectionStore((state) => state.projectContent);
  const [personalities, setPersonalities] = useState<Personality[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    department: "",
    role: "",
    favoriteScripture: "",
    shortBio: "",
    photoPath: "",
    weekDate: ""
  });

  const reload = async () => {
    try {
      setIsLoading(true);
      setPersonalities(await listPersonalities());
    } catch (error) {
      pushToast({ kind: "error", title: "Could not load profiles", description: toErrorMessage(error) });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const reset = () => {
    setEditingId(null);
    setForm({ fullName: "", department: "", role: "", favoriteScripture: "", shortBio: "", photoPath: "", weekDate: "" });
    setIsFormOpen(false);
  };

  const save = async () => {
    if (isSaving) return;
    const nameError = required(form.fullName, "Full name");
    const imageError = validateImagePath(form.photoPath);
    if (nameError || imageError) {
      pushToast({ kind: "warning", title: nameError ?? imageError ?? "Check profile form" });
      return;
    }

    try {
      setIsSaving(true);
      const photoPath = await materializeImage(form.photoPath, form.fullName);
      const input = { ...form, photoPath, isActive: true };
      const saved = editingId ? await updatePersonality(editingId, input) : await createPersonality(input);
      setPreviewContent(personalityToProjection(saved));
      pushToast({ kind: "success", title: editingId ? "Profile updated" : "Profile created" });
      reset();
      await reload();
    } catch (error) {
      pushToast({ kind: "error", title: "Could not save profile", description: toErrorMessage(error) });
    } finally {
      setIsSaving(false);
    }
  };

  const edit = (personality: Personality) => {
    setEditingId(personality.id);
    setIsFormOpen(true);
    setForm({
      fullName: personality.fullName,
      department: personality.department ?? "",
      role: personality.role ?? "",
      favoriteScripture: personality.favoriteScripture ?? "",
      shortBio: personality.shortBio ?? "",
      photoPath: personality.photoPath ?? "",
      weekDate: personality.weekDate ?? ""
    });
  };

  const remove = async (personality: Personality) => {
    if (!(await confirm({ title: "Archive profile?", description: `${personality.fullName} will be removed from the active profile list.`, confirmLabel: "Archive" }))) return;
    await deletePersonality(personality.id);
    pushToast({ kind: "info", title: "Profile archived" });
    await reload();
  };

  return (
    <section>
      {confirmationDialog}
      <PageHeader
        eyebrow="Personality"
        title="Celebrate a member"
        description="Prepare a warm, elegant Personality of the Week slide with department, role, favorite scripture, and photo."
        action={
          <Button
            variant="gold"
            onClick={() => {
              reset();
              setIsFormOpen(true);
            }}
          >
            New Profile
          </Button>
        }
      />

      <div className="grid gap-5">
        <Card className="dl-glass">
          <CardHeader>
            <CardTitle>Profiles</CardTitle>
            <CardDescription>{isLoading ? "Loading profiles..." : `${personalities.length} active profile(s)`}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {personalities.length === 0 ? (
              <EmptyState title="No profiles yet" description="Create the first Personality of the Week profile." />
            ) : (
              personalities.map((personality) => (
                <div key={personality.id} className="rounded-xl border border-border bg-white/[0.72] p-4">
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => setPreviewContent(personalityToProjection(personality))}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-300/20 text-gold-700">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-black">{personality.fullName}</div>
                        <div className="text-sm text-muted-foreground">
                          {[personality.department, personality.role].filter(Boolean).join(" - ")}
                        </div>
                      </div>
                    </div>
                  </button>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="gold" size="sm" onClick={() => void projectContent(personalityToProjection(personality))}>
                      Project
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => edit(personality)}>
                      <Edit3 className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => void remove(personality)}>
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
        title={editingId ? "Edit Profile" : "Create Profile"}
        description="Projection remains safe if the photo is missing; a graceful placeholder appears."
        footer={
          <>
            <Button variant="outline" onClick={reset} disabled={isSaving}>
              Cancel
            </Button>
            <Button variant="gold" onClick={() => void save()} disabled={isSaving}>
              {isSaving ? "Saving..." : editingId ? "Update Profile" : "Create Profile"}
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <Field label="Full name">
            <Input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Department">
              <Input value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} />
            </Field>
            <Field label="Role">
              <Input value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Favorite scripture">
              <Input value={form.favoriteScripture} onChange={(event) => setForm({ ...form, favoriteScripture: event.target.value })} />
            </Field>
            <Field label="Week date">
              <Input type="date" value={form.weekDate} onChange={(event) => setForm({ ...form, weekDate: event.target.value })} />
            </Field>
          </div>
          <Field label="Short bio">
            <Textarea value={form.shortBio} onChange={(event) => setForm({ ...form, shortBio: event.target.value })} />
          </Field>
          <ImagePicker label="Photo" value={form.photoPath} onChange={(photoPath) => setForm({ ...form, photoPath })} />
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
