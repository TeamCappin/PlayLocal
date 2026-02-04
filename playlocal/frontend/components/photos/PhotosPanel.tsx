"use client";

import { useEffect, useState } from "react";
import api, { PhotoItem } from "@/lib/api";

/**
 * Some browsers / drag-drop cases can yield empty file.type.
 * Your backend rejects non-image/*, so we must infer or block.
 */
function inferImageMimeFromName(fileName: string): string | null {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".heic")) return "image/heic";
  if (lower.endsWith(".heif")) return "image/heif";
  return null;
}

export function PhotosPanel({ gameId }: { gameId: string }) {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setError(null);
    setLoading(true);
    try {
      const list = await api.photos.listByGame(gameId);
      setPhotos(list);
    } catch (e: any) {
      setError(e?.message || "Failed to load photos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  async function onPickFile(file: File) {
    setBusy(true);
    setError(null);

    try {
      // ✅ IMPORTANT: backend requires image/*
      const contentType = file.type?.trim() || inferImageMimeFromName(file.name);

      if (!contentType || !contentType.startsWith("image/")) {
        throw new Error("Please upload an image file (jpg/png/webp/etc).");
      }

      // 1) request upload slot (presigned PUT)
      const slot = await api.photos.requestUploadSlot(gameId, {
        fileName: file.name,
        contentType,          // ✅ MUST be image/*
        sizeBytes: file.size,
      });

      // 2) PUT directly to storage
      // ✅ Use THE SAME contentType you used in the upload-slot request
      const putRes = await fetch(slot.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: file,
      });

      if (!putRes.ok) {
        const txt = await putRes.text();
        throw new Error(`Upload failed: ${putRes.status} ${txt}`);
      }

      // 3) finalize
      await api.photos.finalizeUpload(gameId, slot.mediaId);

      // 4) refresh list
      await refresh();
    } catch (e: any) {
      setError(e?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-lg font-semibold text-gray-900">Game Photos</div>
          <div className="text-sm text-gray-500">
            Only joined players can view this tab.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            disabled={busy || loading}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm cursor-pointer hover:bg-emerald-700 disabled:opacity-50">
            <span>{busy ? "Uploading..." : "Upload photo"}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPickFile(f);
                e.currentTarget.value = "";
              }}
            />
          </label>
        </div>
      </div>

      {error && (
        <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </div>
      )}

      {photos.length === 0 ? (
        <div className="text-sm text-gray-500">No photos yet.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {photos.map((p) => (
            <a
              key={p.mediaId}
              href={p.url}
              target="_blank"
              rel="noreferrer"
              className="block rounded-lg overflow-hidden border border-gray-200 hover:shadow-sm transition-shadow"
              title={`Uploaded by ${p.uploaderUserId}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt="Game photo"
                className="w-full h-40 object-cover"
                onError={() => {
                  // If URLs expire, just refresh (your backend returns short-lived signed URLs)
                  // Don’t spam refresh; user can click Refresh if needed.
                }}
              />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
