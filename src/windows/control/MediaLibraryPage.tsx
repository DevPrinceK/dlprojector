import { useEffect, useState } from "react";
import { Image, Upload } from "lucide-react";
import { importMediaAsset, listMediaAssets } from "../../features/media/media.api";
import { toErrorMessage } from "../../lib/error-handling";
import { validateImagePath } from "../../lib/validators";
import { useAppStore } from "../../stores/app.store";
import type { MediaAsset } from "../../types/media";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Modal } from "../../components/ui/modal";
import { EmptyState } from "../../components/common/EmptyState";
import { PageHeader } from "./components/PageHeader";

export function MediaLibraryPage() {
  const pushToast = useAppStore((state) => state.pushToast);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [sourcePath, setSourcePath] = useState("");
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const reload = async () => {
    try {
      setIsLoading(true);
      setAssets(await listMediaAssets());
    } catch (error) {
      pushToast({ kind: "error", title: "Could not load media", description: toErrorMessage(error) });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const importAsset = async () => {
    if (isSaving) return;
    const imageError = validateImagePath(sourcePath);
    if (imageError) {
      pushToast({ kind: "warning", title: imageError });
      return;
    }
    try {
      setIsSaving(true);
      await importMediaAsset(sourcePath);
      pushToast({ kind: "success", title: "Media imported" });
      setSourcePath("");
      setIsImportOpen(false);
      await reload();
    } catch (error) {
      pushToast({ kind: "error", title: "Could not import media", description: toErrorMessage(error) });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section>
      <PageHeader
        eyebrow="Media"
        title="Local media library"
        description="Import approved image assets into the app data directory for announcements and personality profiles."
        action={
          <Button variant="gold" onClick={() => setIsImportOpen(true)}>
            <Upload className="h-4 w-4" />
            Import Image
          </Button>
        }
      />

      <div className="grid gap-5">
        <Card className="dl-glass">
          <CardHeader>
            <CardTitle>Assets</CardTitle>
            <CardDescription>{isLoading ? "Loading media..." : `${assets.length} stored asset(s)`}</CardDescription>
          </CardHeader>
          <CardContent>
            {assets.length === 0 ? (
              <EmptyState title="No media yet" description="Imported images will appear here." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {assets.map((asset) => (
                  <div key={asset.id} className="rounded-xl border border-border bg-white/[0.72] p-4">
                    <Image className="mb-3 h-5 w-5 text-gold-700" />
                    <div className="font-bold">{asset.fileName}</div>
                    <div className="mt-1 break-all text-xs text-muted-foreground">{asset.filePath}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        title="Import Image"
        description="Desktop mode copies PNG, JPG, JPEG, and WEBP files safely into app storage."
        footer={
          <>
            <Button variant="outline" onClick={() => setIsImportOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button variant="gold" onClick={() => void importAsset()} disabled={isSaving}>
              {isSaving ? "Importing..." : "Import"}
            </Button>
          </>
        }
      >
        <Input value={sourcePath} onChange={(event) => setSourcePath(event.target.value)} placeholder="C:\\path\\to\\image.png" />
      </Modal>
    </section>
  );
}
