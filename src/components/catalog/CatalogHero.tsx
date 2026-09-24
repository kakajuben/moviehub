import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, Info, Pencil, Play, Plus, Sparkles, Star } from "lucide-react";

import type { CatalogItem } from "@/lib/catalog";
import { listCatalog } from "@/lib/catalog";
import { useWatchlist } from "@/hooks/useWatchlist";

interface CatalogHeroProps {
  item: CatalogItem;
  isSaved: boolean;
  isAdmin: boolean;
  onToggleWatchlist: () => void;
}

export function CatalogHero({ item, isSaved: initialSaved, isAdmin }: CatalogHeroProps) {
  const { data: catalog } = useQuery({ queryKey: ["catalog"], queryFn: listCatalog });
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const slides = useMemo(() => (catalog ?? [item]).slice(0, 5), [catalog, item]);
  const initialIndex = Math.max(0, slides.findIndex((slide) => slide.id === item.id));
  const [slideIndex, setSlideIndex] = useState(initialIndex);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setSlideIndex(Math.max(0, slides.findIndex((slide) => slide.id === item.id)));
  }, [item.id, slides]);

  useEffect(() => {
    if (paused || slides.length < 2 || typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setSlideIndex((current) => (current + 1) % slides.length), 5000);
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

  const activeItem = slides[slideIndex] ?? item;
  const image = activeItem.backdrop || activeItem.poster;
  const playUrl = activeItem.sources?.[0]?.url;
  const genres = activeItem.genres ?? [];
  const seasonCount = new Set(
    (activeItem.sources ?? [])
      .map((source) => source.season)
      .filter((season): season is number => typeof season === "number"),
  ).size;
  const meta = [
    genres.slice(0, 2).join(" & ") || activeItem.type,
    activeItem.year ? String(activeItem.year) : null,
    seasonCount > 0 ? `${seasonCount} Season${seasonCount > 1 ? "s" : ""}` : null,
  ].filter(Boolean) as string[];
  const saved = catalog ? isInWatchlist(activeItem.id) : initialSaved;

  return (
    <section
      className="hero-section relative isolate w-full px-3 [pt-72px] sm:px-6 sm:pt-[72px] lg:px-8 lg:pt-[72px]"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      {image && (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <img src={image} alt="" className="size-full scale-150 object-cover opacity-45 blur-[140px] saturate-200" />
          <div className="absolute inset-0 bg-slate-950/35" />
        </div>
      )}

      <div className="hero-shell relative mx-auto min-h-[420px] max-w-[1400px] overflow-hidden rounded-3xl border border-white/15 bg-white/[0.04] shadow-2xl ring-1 ring-white/10 backdrop-blur-2xl">
        <div className="absolute inset-0 z-0 overflow-hidden">
          {slides.map((slide, index) => {
            const slideImage = slide.backdrop || slide.poster;
            return slideImage ? (
              <img
                key={slide.id}
                src={slideImage}
                alt=""
                aria-hidden="true"
                fetchPriority={index === slideIndex ? "high" : "low"}
                decoding="async"
                className={`absolute inset-0 size-full object-cover object-top transition-opacity duration-700 ${index === slideIndex ? "opacity-100" : "opacity-0"}`}
              />
            ) : null;
          })}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/35 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/30 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_60%_10%,transparent,oklch(0%_0_0_/_0.55))]" />
        </div>

        <div className="relative z-10 flex min-h-[420px] flex-col justify-end gap-5 p-6 sm:min-h-[500px] sm:p-10 lg:min-h-[560px] lg:p-14">
          <div key={activeItem.id} className="contents animate-in fade-in duration-700">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/90 backdrop-blur-md"><Sparkles className="size-3" /> Featured {activeItem.type}</span>
              {activeItem.rating && <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/40 px-3 py-1 text-xs font-semibold text-amber-400 backdrop-blur-md"><Star className="size-3 fill-current" /> {activeItem.rating}</span>}
            </div>
            <h1 className="max-w-3xl font-display text-3xl font-extrabold uppercase leading-[1.05] tracking-[0.18em] text-foreground drop-shadow-lg sm:text-5xl lg:text-6xl">{activeItem.title}</h1>
            <p className="text-xs font-medium text-foreground/75 sm:text-sm">{meta.join(" · ")}</p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {playUrl ? <a href={playUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-2.5 text-sm font-semibold text-background transition hover:scale-[1.02]"><Play className="size-4 fill-current" /> Play</a> : <Link to="/title/$id" params={{ id: activeItem.id }} className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-2.5 text-sm font-semibold text-background transition hover:scale-[1.02]"><Play className="size-4 fill-current" /> Play</Link>}
              <Link to="/title/$id" params={{ id: activeItem.id }} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/15 px-6 py-2.5 text-sm font-semibold text-foreground backdrop-blur-md transition hover:bg-white/25"><Info className="size-4" /> More Info</Link>
              <button type="button" aria-label={saved ? `Remove ${activeItem.title} from My Box` : `Add ${activeItem.title} to My Box`} onClick={() => void toggleWatchlist(activeItem.id)} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-semibold text-foreground backdrop-blur-md transition hover:bg-white/20">{saved ? <Check className="size-4" /> : <Plus className="size-4" />} My Box</button>
              {isAdmin && <Link to="/admin" className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-5 py-2.5 text-sm font-semibold text-amber-400 transition hover:bg-amber-500/20"><Pencil className="size-4" /> Edit Title</Link>}
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute bottom-5 right-5 z-10 hidden flex-col items-end gap-2 sm:flex"><span className="rounded-full border border-white/15 bg-black/45 px-4 py-1.5 text-[11px] font-semibold text-foreground/90 backdrop-blur-md">👍 We think you'll love this!</span>{activeItem.rating && Number(activeItem.rating) >= 8 && <span className="rounded-full border border-white/15 bg-black/45 px-4 py-1.5 text-[11px] font-semibold text-foreground/90 backdrop-blur-md">🏆 Top rated</span>}</div>
      </div>
    </section>
  );
}

export default CatalogHero;
