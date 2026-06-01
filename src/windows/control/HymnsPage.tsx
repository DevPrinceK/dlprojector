import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Edit3, Music, Search, Trash2 } from "lucide-react";
import { createHymn, deleteHymn, searchHymns, updateHymn } from "../../features/hymns/hymn.api";
import { hymnToProjection, parseLyricsToStanzas } from "../../features/hymns/hymn.utils";
import { toErrorMessage } from "../../lib/error-handling";
import { required } from "../../lib/validators";
import { useAppStore } from "../../stores/app.store";
import { useProjectionStore } from "../../stores/projection.store";
import type { Hymn } from "../../types/hymn";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Modal } from "../../components/ui/modal";
import { EmptyState } from "../../components/common/EmptyState";
import { PageHeader } from "./components/PageHeader";

export function HymnsPage() {
  const pushToast = useAppStore((state) => state.pushToast);
  const setPreviewContent = useProjectionStore((state) => state.setPreviewContent);
  const projectContent = useProjectionStore((state) => state.projectContent);
  const [hymns, setHymns] = useState<Hymn[]>([]);
  const [selected, setSelected] = useState<Hymn | null>(null);
  const [stanzaIndex, setStanzaIndex] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({
    number: "",
    title: "",
    category: "",
    author: "",
    lyrics: ""
  });

  const reload = async (nextQuery = query) => {
    try {
      setIsLoading(true);
      setHymns(await searchHymns(nextQuery));
    } catch (error) {
      pushToast({ kind: "error", title: "Could not load hymns", description: toErrorMessage(error) });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void reload(query), 180);
    return () => window.clearTimeout(timeout);
  }, [query]);

  const selectHymn = (hymn: Hymn, index = 0) => {
    setSelected(hymn);
    setStanzaIndex(index);
    setPreviewContent(hymnToProjection(hymn, index));
  };

  const save = async () => {
    if (isSaving) return;
    const titleError = required(form.title, "Hymn title");
    const lyricsError = required(form.lyrics, "Lyrics");
    if (titleError || lyricsError) {
      pushToast({ kind: "warning", title: titleError ?? lyricsError ?? "Check the hymn form" });
      return;
    }

    const input = {
      number: form.number,
      title: form.title,
      category: form.category,
      author: form.author,
      lyricsJson: parseLyricsToStanzas(form.lyrics, form.title, form.number),
      isActive: true
    };

    try {
      setIsSaving(true);
      const saved = editingId ? await updateHymn(editingId, input) : await createHymn(input);
      pushToast({ kind: "success", title: editingId ? "Hymn updated" : "Hymn created" });
      setEditingId(null);
      setForm({ number: "", title: "", category: "", author: "", lyrics: "" });
      setIsFormOpen(false);
      await reload();
      selectHymn(saved);
    } catch (error) {
      pushToast({ kind: "error", title: "Could not save hymn", description: toErrorMessage(error) });
    } finally {
      setIsSaving(false);
    }
  };

  const edit = (hymn: Hymn) => {
    setEditingId(hymn.id);
    setIsFormOpen(true);
    setForm({
      number: hymn.number,
      title: hymn.title,
      category: hymn.category ?? "",
      author: hymn.author ?? "",
      lyrics: [
        ...hymn.lyricsJson.stanzas,
        hymn.lyricsJson.chorus ? `Chorus:\n${hymn.lyricsJson.chorus}` : ""
      ]
        .filter(Boolean)
        .join("\n\n")
    });
  };

  const remove = async (hymn: Hymn) => {
    await deleteHymn(hymn.id);
    pushToast({ kind: "info", title: "Hymn archived" });
    await reload();
    if (selected?.id === hymn.id) setSelected(null);
  };

  const moveStanza = (direction: -1 | 1) => {
    if (!selected) return;
    const nextIndex = Math.max(0, Math.min(stanzaIndex + direction, selected.lyricsJson.stanzas.length - 1));
    selectHymn(selected, nextIndex);
  };

  return (
    <section>
      <PageHeader
        eyebrow="Hymn Projection"
        title="Hymns, stanza by stanza"
        description="Create, edit, search, preview, and project hymns one stanza at a time with chorus support."
        action={
          <Button
            variant="gold"
            onClick={() => {
              setEditingId(null);
              setForm({ number: "", title: "", category: "", author: "", lyrics: "" });
              setIsFormOpen(true);
            }}
          >
            Add Hymn
          </Button>
        }
      />

      <form
        className="mb-5 flex gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void reload(query);
        }}
      >
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search hymn title, number, category, or lyrics..."
        />
        <Button type="submit" disabled={isLoading}>
          <Search className="h-4 w-4" />
          Search
        </Button>
      </form>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="dl-glass">
          <CardHeader>
            <CardTitle>Hymn Library</CardTitle>
            <CardDescription>{isLoading ? "Loading hymns..." : `${hymns.length} active hymn(s)`}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {hymns.length === 0 ? (
              <EmptyState title="No hymns yet" description="Add your first hymn using the form." />
            ) : (
              hymns.map((hymn) => (
                <div key={hymn.id} className="rounded-xl border border-border bg-white/[0.72] p-4">
                  <button type="button" className="w-full text-left" onClick={() => selectHymn(hymn)}>
                    <div className="flex items-center gap-3">
                      <Music className="h-4 w-4 text-gold-700" />
                      <div>
                        <div className="font-black">{hymn.title}</div>
                        <div className="text-xs text-muted-foreground">Hymn {hymn.number || "No number"}</div>
                      </div>
                    </div>
                  </button>
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => edit(hymn)}>
                      <Edit3 className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => void remove(hymn)}>
                      <Trash2 className="h-4 w-4" />
                      Archive
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="dl-glass">
            <CardHeader>
              <CardTitle>{selected?.title ?? "Select a hymn"}</CardTitle>
              <CardDescription>
                Stanza {(selected ? stanzaIndex + 1 : 0).toString()} of {selected?.lyricsJson.stanzas.length ?? 0}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selected ? (
                <>
                  <div className="rounded-xl bg-navy-900 p-7 text-white">
                    <p className="whitespace-pre-line text-3xl font-bold leading-snug">
                      {hymnToProjection(selected, stanzaIndex).body}
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => moveStanza(-1)} disabled={stanzaIndex <= 0}>
                      <ArrowLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button variant="outline" onClick={() => moveStanza(1)} disabled={stanzaIndex >= selected.lyricsJson.stanzas.length - 1}>
                      Next
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button variant="gold" onClick={() => void projectContent(hymnToProjection(selected, stanzaIndex))}>
                      Project Stanza
                    </Button>
                  </div>
                </>
              ) : (
                <EmptyState title="No hymn selected" description="Choose a hymn to preview stanzas and project." />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        title={editingId ? "Edit Hymn" : "Add Hymn"}
        description={'Separate stanzas with a blank line. Add a chorus using "Chorus:" on its own section.'}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button variant="gold" onClick={() => void save()} disabled={isSaving}>
              {isSaving ? "Saving..." : editingId ? "Update Hymn" : "Create Hymn"}
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Number">
              <Input value={form.number} onChange={(event) => setForm({ ...form, number: event.target.value })} />
            </Field>
            <Field label="Title">
              <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Category">
              <Input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
            </Field>
            <Field label="Author">
              <Input value={form.author} onChange={(event) => setForm({ ...form, author: event.target.value })} />
            </Field>
          </div>
          <Field label="Lyrics">
            <Textarea value={form.lyrics} onChange={(event) => setForm({ ...form, lyrics: event.target.value })} />
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
