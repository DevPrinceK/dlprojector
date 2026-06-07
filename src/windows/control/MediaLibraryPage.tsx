import { useEffect, useState } from "react";
import { Image, Trash2, Upload } from "lucide-react";
import { deleteMediaAsset, importMediaAsset, importMediaDataUrl, importMediaUrl, listMediaAssets } from "../../features/media/media.api";
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
import { useConfirm } from "../../hooks/useConfirm";

export function MediaLibraryPage() {
  const { confirm, confirmationDialog } = useConfirm();
  const pushToast = useAppStore((state) => state.pushToast);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [sourcePath, setSourcePath] = useState("");
  const [selectedImage, setSelectedImage] = useState<{ name: string; dataUrl: string } | null>(null);
  const [imageUrl, setImageUrl] = useState("");
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
    const imageError = validateImagePath(sourcePath || imageUrl || selectedImage?.dataUrl);
    if (imageError) {
      pushToast({ kind: "warning", title: imageError });
      return;
    }
    try {
      setIsSaving(true);
      if (selectedImage) {
        await importMediaDataUrl(selectedImage.name, selectedImage.dataUrl);
      } else if (imageUrl) {
        await importMediaUrl(imageUrl);
      } else {
        await importMediaAsset(sourcePath);
      }
      pushToast({ kind: "success", title: "Media imported" });
      setSourcePath("");
      setSelectedImage(null);
      setImageUrl("");
      setIsImportOpen(false);
      await reload();
    } catch (error) {
      pushToast({ kind: "error", title: "Could not import media", description: toErrorMessage(error) });
    } finally {
      setIsSaving(false);
    }
  };

  const removeAsset = async (asset: MediaAsset) => {
    if (!(await confirm({ title: "Delete media asset?", description: `${asset.fileName} will be removed from local app storage.`, confirmLabel: "Delete asset" }))) return;
    await deleteMediaAsset(asset.id);
    pushToast({ kind: "info", title: "Media deleted", description: asset.fileName });
    await reload();
  };

  return (
    <section>
      {confirmationDialog}
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
                    <Button className="mt-3" variant="ghost" size="sm" onClick={() => void removeAsset(asset)}>
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
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
        <div className="grid gap-3">
          <label className="inline-flex">
            <input
              className="sr-only"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  if (typeof reader.result === "string") {
                    setSelectedImage({ name: file.name.replace(/\.[^.]+$/, ""), dataUrl: reader.result });
                    setSourcePath("");
                    setImageUrl("");
                  }
                };
                reader.readAsDataURL(file);
              }}
            />
            <span className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground shadow">
              Pick Image from PC
            </span>
          </label>
          <Input value={imageUrl} onChange={(event) => { setImageUrl(event.target.value); setSelectedImage(null); setSourcePath(""); }} placeholder="Or paste https:// image link" />
          <Input value={sourcePath} onChange={(event) => { setSourcePath(event.target.value); setSelectedImage(null); setImageUrl(""); }} placeholder="Advanced: C:\\path\\to\\image.png" />
          {selectedImage ? <img src={selectedImage.dataUrl} alt="" className="h-36 rounded-xl object-cover" /> : null}
        </div>
      </Modal>
    </section>
  );
}
