import { useEffect, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, CalendarDays, Plus } from "lucide-react";
import {
  addServiceItem,
  createServiceProgram,
  getActiveServiceProgram,
  listServicePrograms,
  updateServiceProgram,
  reorderServiceItems
} from "../../features/service-program/service-program.api";
import { toErrorMessage } from "../../lib/error-handling";
import { required } from "../../lib/validators";
import { useAppStore } from "../../stores/app.store";
import { useProjectionStore } from "../../stores/projection.store";
import type { ServiceItemType } from "../../types/common";
import type { ServiceItem, ServiceProgram } from "../../types/service-program";
import type { ProjectionContent } from "../../types/projection";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";
import { Modal } from "../../components/ui/modal";
import { EmptyState } from "../../components/common/EmptyState";
import { PageHeader } from "./components/PageHeader";

export function ServiceProgramPage() {
  const pushToast = useAppStore((state) => state.pushToast);
  const previewContent = useProjectionStore((state) => state.previewContent);
  const setPreviewContent = useProjectionStore((state) => state.setPreviewContent);
  const projectContent = useProjectionStore((state) => state.projectContent);
  const [program, setProgram] = useState<ServiceProgram | null>(null);
  const [programs, setPrograms] = useState<ServiceProgram[]>([]);
  const [programForm, setProgramForm] = useState({ title: "Sunday Worship Service", serviceDate: "", notes: "" });
  const [itemForm, setItemForm] = useState({ itemType: "text" as ServiceItemType, title: "", body: "" });
  const [isProgramFormOpen, setIsProgramFormOpen] = useState(false);
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [isSavingProgram, setIsSavingProgram] = useState(false);
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const reload = async () => {
    try {
      setIsLoading(true);
      const [activeProgram, allPrograms] = await Promise.all([getActiveServiceProgram(), listServicePrograms()]);
      const selectedProgram = program
        ? allPrograms.find((candidate) => candidate.id === program.id) ?? activeProgram ?? allPrograms[0] ?? null
        : activeProgram ?? allPrograms[0] ?? null;
      setPrograms(allPrograms);
      setProgram(selectedProgram);
      return selectedProgram;
    } catch (error) {
      pushToast({ kind: "error", title: "Could not load service program", description: toErrorMessage(error) });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const announceProgramSelection = (selectedProgram: ServiceProgram | null) => {
    if (!selectedProgram) return;
    window.dispatchEvent(new CustomEvent<ServiceProgram>("dl:service-program-changed", { detail: selectedProgram }));
  };

  const createProgram = async () => {
    if (isSavingProgram) return;
    const titleError = required(programForm.title, "Program title");
    if (titleError) {
      pushToast({ kind: "warning", title: titleError });
      return;
    }
    try {
      setIsSavingProgram(true);
      const saved = await createServiceProgram({ ...programForm, isActive: true });
      setProgram(saved);
      await reload();
      announceProgramSelection(saved);
      setIsProgramFormOpen(false);
      pushToast({ kind: "success", title: "Service program created" });
    } catch (error) {
      pushToast({ kind: "error", title: "Could not create program", description: toErrorMessage(error) });
    } finally {
      setIsSavingProgram(false);
    }
  };

  const addCustomItem = async () => {
    if (isSavingItem) return;
    if (!program) return;
    const titleError = required(itemForm.title, "Item title");
    if (titleError) {
      pushToast({ kind: "warning", title: titleError });
      return;
    }
    setIsSavingItem(true);
    const content = contentForItem(itemForm.itemType, itemForm.title, itemForm.body);
    try {
      await addServiceItem({
        serviceProgramId: program.id,
        itemType: itemForm.itemType,
        title: itemForm.title,
        customContentJson: content
      });
      setItemForm({ itemType: "text", title: "", body: "" });
      setIsItemFormOpen(false);
      announceProgramSelection(await reload());
      pushToast({ kind: "success", title: "Service item added" });
    } catch (error) {
      pushToast({ kind: "error", title: "Could not add service item", description: toErrorMessage(error) });
    } finally {
      setIsSavingItem(false);
    }
  };

  const addPreview = async () => {
    if (!program || !previewContent) return;
    await addServiceItem({
      serviceProgramId: program.id,
      itemType: previewContent.type === "loader" ? "custom" : (previewContent.type as ServiceItemType),
      title: previewContent.title ?? previewContent.reference ?? previewContent.type,
      customContentJson: previewContent
    });
    announceProgramSelection(await reload());
    pushToast({ kind: "success", title: "Preview added to service" });
  };

  const chooseProgram = async (candidate: ServiceProgram, makeActive = false) => {
    setProgram(candidate);
    announceProgramSelection(candidate);
    if (!makeActive || candidate.isActive) return;
    try {
      const updated = await updateServiceProgram(candidate.id, {
        title: candidate.title,
        serviceDate: candidate.serviceDate ?? undefined,
        notes: candidate.notes ?? undefined,
        isActive: true
      });
      setProgram(updated);
      await reload();
      announceProgramSelection(updated);
      pushToast({ kind: "success", title: "Current service selected", description: updated.title });
    } catch (error) {
      pushToast({ kind: "error", title: "Could not select service", description: toErrorMessage(error) });
    }
  };

  const stageItem = (item: ServiceItem) => {
    const content = contentForServiceItem(item);
    setPreviewContent(content);
    pushToast({ kind: "success", title: "Loaded service item into preview", description: item.title });
  };

  const moveItem = async (item: ServiceItem, direction: -1 | 1) => {
    if (!program) return;
    const items = [...program.items].sort((a, b) => a.position - b.position);
    const index = items.findIndex((candidate) => candidate.id === item.id);
    const swapIndex = index + direction;
    if (index < 0 || swapIndex < 0 || swapIndex >= items.length) return;
    const nextItems = [...items];
    [nextItems[index], nextItems[swapIndex]] = [nextItems[swapIndex], nextItems[index]];
    await reorderServiceItems(program.id, nextItems.map((candidate) => candidate.id));
    announceProgramSelection(await reload());
  };

  return (
    <section>
      <PageHeader
        eyebrow="Service Program"
        title="Order of service"
        description="Build the flow before service, reorder items, attach projected content, and move confidently through the program."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setIsProgramFormOpen(true)}>
              <CalendarDays className="h-4 w-4" />
              New Program
            </Button>
            <Button variant="gold" onClick={() => setIsItemFormOpen(true)} disabled={!program}>
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
            <Button variant="outline" onClick={() => void addPreview()} disabled={!program || !previewContent}>
              Add Current Preview
            </Button>
          </div>
        }
      />

      <div className="grid gap-5">
        <Card className="dl-glass">
          <CardHeader>
            <CardTitle>Services</CardTitle>
            <CardDescription>
              Select the recurring service you are preparing or mark it as the current projection service.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {programs.length ? (
              <div className="safe-scrollbar flex gap-3 overflow-x-auto pb-2">
                {programs.map((candidate) => {
                  const isSelected = program?.id === candidate.id;
                  return (
                    <div
                      key={candidate.id}
                      className={`min-w-[240px] rounded-xl border p-4 text-left transition ${
                        isSelected ? "border-gold-500 bg-gold-300/15" : "border-border bg-white/[0.72] hover:bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-black">{candidate.title}</div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {candidate.serviceDate ?? "Recurring service"}
                          </div>
                        </div>
                        {candidate.isActive ? <Badge>Current</Badge> : null}
                      </div>
                      <div className="mt-3 text-xs text-muted-foreground">{candidate.items.length} item(s)</div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" onClick={() => void chooseProgram(candidate)}>
                          Open
                        </Button>
                        <Button
                          variant={candidate.isActive ? "outline" : "gold"}
                          size="sm"
                          onClick={() => void chooseProgram(candidate, true)}
                        >
                          {candidate.isActive ? "Current" : "Use"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState title="No services yet" description="Create recurring service programs such as Sunday Worship Service or Monday Bible Studies." />
            )}
          </CardContent>
        </Card>

        <Card className="dl-glass">
          <CardHeader>
            <CardTitle>{program?.title ?? "No active program"}</CardTitle>
            <CardDescription>{isLoading ? "Loading service program..." : program?.serviceDate ?? "Create or load a service program to begin."}</CardDescription>
          </CardHeader>
          <CardContent>
            {program?.items.length ? (
              <div className="space-y-3">
                {program.items
                  .slice()
                  .sort((a, b) => a.position - b.position)
                  .map((item) => (
                    <div key={item.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-white/[0.72] p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-900 text-sm font-black text-gold-300">
                        {item.position}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-black">{item.title}</div>
                        <Badge className="mt-1">{item.itemType}</Badge>
                      </div>
                      <Button variant="outline" size="icon" onClick={() => void moveItem(item, -1)}>
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => void moveItem(item, 1)}>
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => stageItem(item)}>
                        Stage
                      </Button>
                      <Button variant="gold" size="sm" onClick={() => void projectContent(contentForServiceItem(item))}>
                        Project
                      </Button>
                    </div>
                  ))}
              </div>
            ) : (
              <EmptyState title="No items yet" description="Add custom items or attach the current preview to your service program." />
            )}
          </CardContent>
        </Card>
      </div>

      <Modal
        open={isProgramFormOpen}
        onOpenChange={setIsProgramFormOpen}
        title="Create Active Program"
        description="Creating a new program makes it the active service flow."
        footer={
          <>
            <Button variant="outline" onClick={() => setIsProgramFormOpen(false)} disabled={isSavingProgram}>
              Cancel
            </Button>
            <Button variant="gold" onClick={() => void createProgram()} disabled={isSavingProgram}>
              {isSavingProgram ? "Saving..." : "Create Program"}
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <Field label="Title">
            <Input value={programForm.title} onChange={(event) => setProgramForm({ ...programForm, title: event.target.value })} />
          </Field>
          <Field label="Service date">
            <Input type="date" value={programForm.serviceDate} onChange={(event) => setProgramForm({ ...programForm, serviceDate: event.target.value })} />
          </Field>
          <Field label="Notes">
            <Textarea value={programForm.notes} onChange={(event) => setProgramForm({ ...programForm, notes: event.target.value })} />
          </Field>
        </div>
      </Modal>

      <Modal
        open={isItemFormOpen}
        onOpenChange={setIsItemFormOpen}
        title="Add Service Item"
        description="Use text, blank, logo, or custom slides for simple service steps."
        footer={
          <>
            <Button variant="outline" onClick={() => setIsItemFormOpen(false)} disabled={isSavingItem}>
              Cancel
            </Button>
            <Button variant="gold" onClick={() => void addCustomItem()} disabled={!program || isSavingItem}>
              {isSavingItem ? "Saving..." : "Add Item"}
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <Field label="Type">
            <select
              className="h-11 rounded-lg border border-input bg-white px-3 text-sm"
              value={itemForm.itemType}
              onChange={(event) => setItemForm({ ...itemForm, itemType: event.target.value as ServiceItemType })}
            >
              <option value="text">Text</option>
              <option value="custom">Custom Slide</option>
              <option value="blank">Blank</option>
              <option value="logo">Logo</option>
            </select>
          </Field>
          <Field label="Title">
            <Input value={itemForm.title} onChange={(event) => setItemForm({ ...itemForm, title: event.target.value })} />
          </Field>
          <Field label="Body">
            <Textarea value={itemForm.body} onChange={(event) => setItemForm({ ...itemForm, body: event.target.value })} />
          </Field>
        </div>
      </Modal>
    </section>
  );
}

function contentForServiceItem(item: ServiceItem): ProjectionContent {
  if (item.customContentJson) return item.customContentJson;
  return contentForItem(item.itemType, item.title, "");
}

function contentForItem(type: ServiceItemType, title: string, body: string): ProjectionContent {
  if (type === "blank") return { type: "blank" };
  if (type === "logo") return { type: "logo", title: "DLCF Legon", subtitle: "Deeper Life Campus Fellowship" };
  return { type: "custom", title, body };
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
