import type { ChangeEvent } from "react";
import { Image, Link } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";

interface ImagePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function ImagePicker({ label, value, onChange }: ImagePickerProps) {
  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onChange(reader.result);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="rounded-xl border border-border bg-white/[0.68] p-3">
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex">
            <input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseFile} />
            <span className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/[0.92]">
              <Image className="h-4 w-4" />
              Pick from PC
            </span>
          </label>
          <Button type="button" variant="outline" onClick={() => onChange("")} disabled={!value}>
            Clear
          </Button>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Link className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            value={value.startsWith("data:image/") ? "Image selected from PC" : value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Or paste https:// image link"
            disabled={value.startsWith("data:image/")}
          />
        </div>
        {value ? (
          <div className="mt-3 overflow-hidden rounded-lg border border-border bg-white">
            <img src={value} alt="" className="h-32 w-full object-cover" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
