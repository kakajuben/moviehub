import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Download, AlertCircle, Monitor, X, Copy } from "lucide-react";
import { toast } from "sonner";
import type { VideoSource } from "@/lib/catalog";
import { InAppBrowser } from "@/components/InAppBrowser";

interface VideoPlayerProps {
  sources: VideoSource[];
  telegramUrl?: string | null;
  vkUrl?: string | null;
  snapWcUrl?: string;
  title: string;
  onClose?: () => void;
}

const isVkUrl = (url?: string) =>
  Boolean(url && (/vk\.com|vkvideo\.ru|vk\.ru/i.test(url) || url.includes("video_ext.php")));

export function VideoPlayer({
  sources = [],
  snapWcUrl = "https://snapwc.com/vk",
  title,
  onClose,
}: VideoPlayerProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [hasIframeError, setHasIframeError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const seasons = useMemo(() => {
    const set = new Set<number>();
    sources.forEach((s) => {
      if (typeof s.season === "number") set.add(s.season);
    });
    return [...set].sort((a, b) => a - b);
  }, [sources]);

  const [activeSeason, setActiveSeason] = useState<number | null>(seasons[0] ?? null);

  const visible = useMemo(
    () =>
      sources
        .map((s, idx) => ({ ...s, idx }))
        .filter((s) => (activeSeason === null ? true : s.season === activeSeason)),
    [sources, activeSeason],
  );

  const activeSource = sources[activeIdx] ?? sources[0];
  const isDirectVideo = Boolean(activeSource?.url?.match(/\.(mp4|webm|mkv|mov|m3u8)(\?.*)?$/i));
  const isVk = isVkUrl(activeSource?.url);

  useEffect(() => {
    setMounted(false);
    setHasIframeError(false);
  }, [activeIdx]);

  useEffect(() => {
    if (!mounted || isDirectVideo || isVk || !activeSource?.url) return undefined;
    const timer = setTimeout(() => {
      try {
        const doc = iframeRef.current?.contentDocument;
        if (!iframeRef.current || (doc && doc.body && doc.body.childElementCount === 0)) {
          setHasIframeError(true);
        }
      } catch {
        /* cross-origin frame loaded fine */
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [mounted, activeSource, isDirectVideo, isVk]);

  if (!activeSource) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        No streaming source added yet.
      </div>
    );
  }

  const vkLink = activeSource.vkDownloadUrl || activeSource.url;
  const mirrorLink = activeSource.mirrorDownloadUrl || activeSource.downloadUrl;

  const copyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      return false;
    }
  };

  const handleSnapWc = async () => {
    const ok = await copyToClipboard(vkLink);
    toast[ok ? "success" : "error"](
      ok ? "VK link copied! Paste into SnapWC to download" : "Could not copy the link — copy it manually",
    );
    window.open(snapWcUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-3 rounded-2xl border border-border bg-card p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Select server
        </span>
        {onClose && (
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" /> Close player
          </button>
        )}
      </div>

      {seasons.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {seasons.map((s) => (
            <button
              key={s}
              onClick={() => setActiveSeason(s)}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                activeSeason === s
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              Season {s}
            </button>
          ))}
        </div>
      )}

      {visible.length > 1 ? (
        <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
          {visible.map((s) => (
            <button
              key={s.idx}
              onClick={() => setActiveIdx(s.idx)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                activeIdx === s.idx
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.episode || s.server || `Server ${s.idx + 1}`}
            </button>
          ))}
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-background p-3">
        <p className="truncate text-xs text-muted-foreground">
          {activeSource.episode || activeSource.server || "Stream"}{" "}
          {activeSource.type ? `· ${activeSource.type}` : ""}
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <button
            onClick={() => {
              setHasIframeError(false);
              setMounted(true);
            }}
            disabled={!activeSource.url}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-2 text-xs font-medium text-foreground hover:bg-accent disabled:opacity-50"
          >
            <Monitor className="size-4" /> Try in-app player
          </button>
          <button
            onClick={handleSnapWc}
            disabled={!vkLink}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-2 text-xs font-medium text-foreground hover:bg-accent disabled:opacity-50"
          >
            <Download className="size-4 text-sky-brand" /> Download vk link
          </button>
          <a
            href={activeSource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
          >
            <ExternalLink className="size-4" /> Launch in External Tab
          </a>
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <button
            onClick={async () => {
              const ok = await copyToClipboard(vkLink || activeSource.url);
              toast[ok ? "success" : "error"](ok ? "Link copied" : "Could not copy the link");
            }}
            disabled={!vkLink && !activeSource.url}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <Copy className="size-4" /> Copy link
          </button>
          {mirrorLink ? (
            <a
              href={mirrorLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-2 text-xs font-medium text-foreground hover:bg-accent"
            >
              <Download className="size-4" /> Mirror Download
            </a>
          ) : null}
        </div>
      </div>

      {mounted && (
        <div className="overflow-hidden rounded-xl border border-border bg-black">
          {isVk ? (
            <InAppBrowser url={activeSource.url} title={title} />
          ) : hasIframeError ? (
            <div className="flex flex-col gap-3 bg-card p-4 text-center">
              <AlertCircle className="mx-auto size-7 text-amber-400" />
              <p className="text-sm font-medium text-foreground">
                VK Stream requires external playback or robot confirmation.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <a
                  href={activeSource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
                >
                  <ExternalLink className="size-4" /> Launch in External Tab
                </a>
                <a
                  href={snapWcUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-accent"
                >
                  <Download className="size-4" /> Download via SnapWC
                </a>
              </div>
            </div>
          ) : isDirectVideo ? (
            <video
              key={activeSource.url}
              controls
              autoPlay
              playsInline
              className="aspect-video w-full object-contain"
              src={activeSource.url}
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <iframe
              ref={iframeRef}
              src={activeSource.url.includes("drive.google.com") ? activeSource.url.replace(/\/view.*/, "/preview") : activeSource.url}
              title={title}
              className="aspect-video w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
            />
          )}
        </div>
      )}
    </div>
  );
}
