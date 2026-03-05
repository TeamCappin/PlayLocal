'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import api, { PhotoItem } from '@/lib/api';

const MAX_PHOTOS = 5;

// Fixed thumbnail tile size (rectangle). Adjust if you want smaller/larger.
const THUMB_W = 56;
const THUMB_H = 32;

function inferImageMimeFromName(fileName: string): string | null {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.heic')) return 'image/heic';
  if (lower.endsWith('.heif')) return 'image/heif';
  return null;
}

export function PhotosPanel({
  gameId,
  canUpload = false,
}: {
  gameId: string;
  canUpload?: boolean;
}) {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // IMPORTANT: activeIndex is the SLOT index [0..MAX_PHOTOS-1]
  const [activeIndex, setActiveIndex] = useState(0);

  // scroll container for thumbnails
  const thumbsViewportRef = useRef<HTMLDivElement | null>(null);

  // hidden file input so "+" tiles can open picker
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isMaxed = useMemo(() => photos.length >= MAX_PHOTOS, [photos.length]);
  const remaining = useMemo(
    () => Math.max(0, MAX_PHOTOS - photos.length),
    [photos.length]
  );

  const hasPhotos = photos.length > 0;

  // Always render MAX_PHOTOS slots (photo or null)
  const thumbSlots = useMemo(
    () => Array.from({ length: MAX_PHOTOS }, (_, i) => photos[i] ?? null),
    [photos]
  );

  // Main viewer photo:
  // If active slot is empty, fall back to first photo (if any)
  const activePhoto = useMemo(() => {
    if (!hasPhotos) return null;
    return photos[activeIndex] ?? photos[0] ?? null;
  }, [photos, activeIndex, hasPhotos]);

  const canGoPrev = activeIndex > 0;
  const canGoNext = activeIndex < MAX_PHOTOS - 1;

  const tileStyle = useMemo(
    () => ({ width: THUMB_W, height: THUMB_H }) as const,
    []
  );

  const tileBase =
    'shrink-0 rounded-lg overflow-hidden border transition-all duration-150';

  function openPicker() {
    if (!canUpload || busy || isMaxed) return;
    fileInputRef.current?.click();
  }

  async function refresh() {
    setError(null);
    setLoading(true);
    try {
      const list = await api.photos.listByGame(gameId);
      setPhotos(list);

      // Keep activeIndex within SLOT range always
      setActiveIndex((prev) => Math.min(Math.max(prev, 0), MAX_PHOTOS - 1));
    } catch (e: any) {
      setError(e?.message || 'Failed to load photos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  // Scroll selected slot into view (works for photo + plus slots)
  useEffect(() => {
    const el = document.getElementById(`thumb-${activeIndex}`);
    if (el) {
      el.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [activeIndex]);

  function scrollThumbsBy(px: number) {
    const vp = thumbsViewportRef.current;
    if (!vp) return;
    vp.scrollBy({ left: px, behavior: 'smooth' });
  }

  function prevThumb() {
    setActiveIndex((i) => Math.max(0, i - 1));
    scrollThumbsBy(-(THUMB_W + 16));
  }

  function nextThumb() {
    setActiveIndex((i) => Math.min(MAX_PHOTOS - 1, i + 1));
    scrollThumbsBy(THUMB_W + 16);
  }

  async function onPickFile(file: File) {
    if (!canUpload) return;

    if (isMaxed) {
      setError(`This game already has the maximum of ${MAX_PHOTOS} photos.`);
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const contentType =
        file.type?.trim() || inferImageMimeFromName(file.name);
      if (!contentType || !contentType.startsWith('image/')) {
        throw new Error('Please upload an image file (jpg/png/webp/etc).');
      }

      const slot = await api.photos.requestUploadSlot(gameId, {
        fileName: file.name,
        contentType,
        sizeBytes: file.size,
      });

      const putRes = await fetch(slot.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: file,
      });

      if (!putRes.ok) {
        const txt = await putRes.text();
        throw new Error(`Upload failed: ${putRes.status} ${txt}`);
      }

      await api.photos.finalizeUpload(gameId, slot.mediaId);
      await refresh();
    } catch (e: any) {
      setError(e?.message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <div className="text-lg font-semibold text-gray-900">Game Photos</div>
          <div className="text-sm text-gray-500">
            {canUpload
              ? isMaxed
                ? `Max ${MAX_PHOTOS} photos reached for this game.`
                : `You can upload photos because you joined this game. (${remaining} slots left)`
              : 'Anyone can view photos. Join the game to upload.'}
          </div>

          {/* Counter */}
          <div className="mt-2 inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-gray-800">
            {hasPhotos
              ? `${Math.min(activeIndex + 1, photos.length)} / ${photos.length}`
              : `0 / ${MAX_PHOTOS}`}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={refresh}
            disabled={busy || loading}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>

          {canUpload && (
            <button
              type="button"
              onClick={openPicker}
              disabled={busy || isMaxed}
              className={[
                'px-4 py-2 rounded-lg text-sm font-medium',
                busy || isMaxed
                  ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700',
              ].join(' ')}
              title={
                isMaxed ? `Max ${MAX_PHOTOS} photos per game` : 'Upload a photo'
              }
            >
              {isMaxed
                ? `Limit reached (${MAX_PHOTOS})`
                : busy
                  ? 'Uploading...'
                  : 'Upload photo'}
            </button>
          )}

          {/* Hidden input: used by Upload button and + tiles */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            disabled={busy || isMaxed || !canUpload}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPickFile(f);
              e.currentTarget.value = '';
            }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </div>
      )}

      {/* Empty */}
      {!hasPhotos ? (
        <div className="text-sm text-gray-500">No photos yet.</div>
      ) : (
        <div className="space-y-3">
          {/* Main Viewer */}
          <div className="relative w-full overflow-hidden rounded-xl border border-gray-200 bg-neutral-950">
            <div className="h-[520px] w-full flex items-center justify-center">
              {activePhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activePhoto.url}
                  alt="Game photo"
                  className="max-h-full max-w-full object-contain select-none"
                  draggable={false}
                />
              ) : (
                <div className="text-white/70 text-sm">No photo selected</div>
              )}
            </div>

            {activePhoto && (
              <a
                href={activePhoto.url}
                target="_blank"
                rel="noreferrer"
                className="absolute right-3 bottom-3 z-20 text-sm font-semibold px-3 py-2 rounded-lg bg-white/95 text-gray-900 hover:bg-white shadow"
                title="Opens in a new tab"
              >
                Open in new tab
              </a>
            )}
          </div>

          {/* Thumbnails row with arrows on both ends */}
          <div className="flex items-center gap-2">
            {/* LEFT ARROW */}
            <button
              type="button"
              onClick={prevThumb}
              disabled={!canGoPrev}
              aria-label="Previous thumbnail"
              style={{ height: THUMB_H }}
              className={[
                'shrink-0 min-w-[44px] rounded-lg border',
                'flex items-center justify-center',
                '!bg-neutral-900 !text-white shadow-md',
                'hover:!bg-black active:scale-[0.98] transition',
                'disabled:opacity-40 disabled:cursor-not-allowed',
              ].join(' ')}
              title="Previous"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            {/* Thumbnails strip (always MAX_PHOTOS tiles) */}
            <div
              ref={thumbsViewportRef}
              className="flex-1 overflow-x-auto overflow-y-hidden"
            >
              <div className="flex items-center gap-2 pr-2 pb-2">
                {thumbSlots.map((p, idx) => {
                  const selected = idx === activeIndex;
                  const canAdd = canUpload && !isMaxed && !busy;

                  // EMPTY SLOT: fixed rectangle, selectable (shows green when active)
                  if (!p) {
                    return (
                      <button
                        key={`slot-${idx}`}
                        id={`thumb-${idx}`}
                        type="button"
                        style={tileStyle}
                        onClick={() => {
                          setActiveIndex(idx); // make it "selected" like photo tiles
                          if (canAdd) openPicker();
                        }}
                        disabled={!canAdd && !selected}
                        className={[
                          tileBase,
                          'bg-gray-50 border-gray-200 flex items-center justify-center',
                          selected
                            ? 'border-emerald-500 ring-4 ring-emerald-500/30 shadow-xl opacity-100 scale-[1.08]'
                            : canAdd
                              ? 'hover:border-gray-300 hover:bg-gray-100 opacity-90 hover:opacity-100'
                              : 'opacity-60 cursor-not-allowed',
                        ].join(' ')}
                        title={canAdd ? 'Add photo' : `Empty slot ${idx + 1}`}
                      >
                        <span className="text-xl font-semibold text-gray-400 select-none">
                          ＋
                        </span>
                      </button>
                    );
                  }

                  // PHOTO SLOT: fixed rectangle, selectable (green when active)
                  return (
                    <button
                      key={p.mediaId}
                      id={`thumb-${idx}`}
                      type="button"
                      style={tileStyle}
                      onClick={() => setActiveIndex(idx)}
                      className={[
                        tileBase,
                        'bg-gray-100 border-gray-200',
                        'focus:outline-none focus:ring-2 focus:ring-emerald-500',
                        selected
                          ? 'border-emerald-500 ring-4 ring-emerald-500/30 shadow-xl opacity-100 scale-[1.08]'
                          : 'hover:border-gray-300 opacity-90 hover:opacity-100 scale-100',
                      ].join(' ')}
                      title={`Photo ${idx + 1}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.url}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                        draggable={false}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RIGHT ARROW */}
            <button
              type="button"
              onClick={nextThumb}
              disabled={!canGoNext}
              aria-label="Next thumbnail"
              style={{ height: THUMB_H }}
              className={[
                'shrink-0 min-w-[44px] rounded-lg border',
                'flex items-center justify-center',
                '!bg-neutral-900 !text-white shadow-md',
                'hover:!bg-black active:scale-[0.98] transition',
                'disabled:opacity-40 disabled:cursor-not-allowed',
              ].join(' ')}
              title="Next"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
