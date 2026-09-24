import { useMemo, useRef, useState } from "react";
import { ExternalLink, Lock, Maximize2, Minimize2, RotateCw } from "lucide-react";

interface InAppBrowserProps {
  url: string;
  title?: string;
}

export function InAppBrowser({ url, title = "In-App Browser" }: InAppBrowserProps) {
  const [reloadKey, setReloadKey] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const proxiedUrl = useMemo(() => `/api/vk-proxy?url=${encodeURIComponent(url)}`, [url]);
  const isSecure = url.startsWith("https://");

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      void el.requestFullscreen?.().then(() => setFullscreen(true)).catch(() => setFullscreen(false));
    } else {
      void document.exitFullscreen?.().then(() => setFullscreen(false));
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
    >
      <div className="flex items-center gap-2 border-b border-border bg-card px-3 py-2">
        <button
          type="button"
          onClick={() => setReloadKey((k) => k + 1)}
          aria-label="Reload page"
          className="rounded-lg border border-border bg-secondary p-1.5 text-muted-foreground hover:text-foreground"
        >
          <RotateCw className="size-3.5" />
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5">
          <Lock className={`size-3.5 shrink-0 ${isSecure ? "text-sky-brand" : "text-muted-foreground"}`} />
          <span className="truncate text-xs text-muted-foreground">{url}</span>
        </div>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open in new tab"
          className="rounded-lg border border-border bg-secondary p-1.5 text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="size-3.5" />
        </a>

        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label="Toggle fullscreen"
          className="rounded-lg border border-border bg-secondary p-1.5 text-muted-foreground hover:text-foreground"
        >
          {fullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
        </button>
      </div>

      <div className="relative aspect-video w-full bg-black">
        <iframe
          key={reloadKey}
          src={proxiedUrl}
          title={title}
          className="size-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
    </div>
  );
}
