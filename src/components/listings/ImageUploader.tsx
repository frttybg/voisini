"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Overlay";
import { MAX_IMAGES_PER_LISTING } from "@/lib/validation";

export type UploadedImage = { path: string; url: string; previewUrl: string };

/** Tarayıcıda yeniden boyutlandırma — yükleme boyutunu ve maliyeti düşürür. */
async function compress(file: File, maxSide = 1600, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => resolve(blob ?? file), "image/jpeg", quality);
  });
}

export function ImageUploader({
  images,
  onChange,
}: {
  images: UploadedImage[];
  onChange: (next: UploadedImage[]) => void;
}) {
  const { t } = useI18n();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(0);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
      const room = MAX_IMAGES_PER_LISTING - images.length;
      const selected = list.slice(0, Math.max(room, 0));
      if (!selected.length) return;

      setUploading((n) => n + selected.length);
      const uploaded: UploadedImage[] = [];

      for (const file of selected) {
        try {
          const blob = await compress(file);
          const body = new FormData();
          body.append("file", new File([blob], "photo.jpg", { type: "image/jpeg" }));
          body.append("bucket", "listings");

          const res = await fetch("/api/upload", { method: "POST", body });
          if (!res.ok) {
            toast(t.common.error, "error");
            continue;
          }
          const data = (await res.json()) as { path: string; url: string };
          uploaded.push({ path: data.path, url: data.url, previewUrl: URL.createObjectURL(blob) });
        } catch {
          toast(t.common.error, "error");
        } finally {
          setUploading((n) => Math.max(n - 1, 0));
        }
      }

      if (uploaded.length) onChange([...images, ...uploaded]);
    },
    [images, onChange, t, toast],
  );

  function move(from: number, to: number) {
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragging
            ? "border-[var(--brand-400)] bg-[var(--brand-50)]"
            : "border-[var(--line)] hover:border-[var(--brand-300)]",
        )}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-sunken)] text-[var(--ink-muted)]">
          <Icon name={uploading ? "loader" : "camera"} size={22} className={uploading ? "animate-spin" : ""} />
        </span>
        <span className="text-sm font-semibold text-[var(--ink)]">{t.listing.dropHere}</span>
        <span className="text-[0.8125rem] text-[var(--ink-muted)]">{t.listing.photosHint}</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        capture={undefined}
        className="hidden"
        onChange={(e) => {
          if (e.target.files) void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {images.length ? (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((img, i) => (
            <li
              key={img.path}
              className="group relative aspect-square overflow-hidden rounded-[var(--radius-md)] border border-[var(--line)]"
            >
              <Image src={img.previewUrl} alt="" fill sizes="160px" className="object-cover" unoptimized />
              {i === 0 ? (
                <span className="absolute start-1.5 top-1.5 rounded-full bg-[var(--brand-600)] px-2 py-0.5 text-[0.625rem] font-bold text-white">
                  {t.listing.mainPhoto}
                </span>
              ) : null}
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-[rgb(6_16_13/0.55)] p-1 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => move(i, i - 1)}
                  className="rounded p-1 text-white/90 hover:text-white"
                  aria-label="←"
                >
                  <Icon name="chevronLeft" size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => onChange(images.filter((_, index) => index !== i))}
                  className="rounded p-1 text-white/90 hover:text-white"
                  aria-label={t.common.delete}
                >
                  <Icon name="trash" size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, i + 1)}
                  className="rounded p-1 text-white/90 hover:text-white"
                  aria-label="→"
                >
                  <Icon name="chevronRight" size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
