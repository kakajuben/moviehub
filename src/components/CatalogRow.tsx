import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, ChevronLeft, Play, Info, Star } from "lucide-react";
import type { CatalogItem } from "@/lib/catalog";

function Scroller({ children, label }: { children: React.ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const scrollBy = (dir: number) =>
    ref.current?.scrollBy({ left: dir * (ref.current.clientWidth * 0.8), behavior: "smooth" });

  return (
    <div className="group/row relative">
      <div
        ref={ref}
        aria-label={label}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-1 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      <button
        type="button"
        aria-label={`Scroll ${label} left`}
        onClick={() => scrollBy(-1)}
        className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full border border-white/15 bg-black/50 p-3 text-foreground opacity-0 shadow-xl backdrop-blur-md transition group-hover/row:opacity-100 md:block"
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        type="button"
        aria-label={`Scroll ${label} right`}
        onClick={() => scrollBy(1)}
        className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full border border-white/15 bg-black/50 p-3 text-foreground opacity-0 shadow-xl backdrop-blur-md transition group-hover/row:opacity-100 md:block"
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}

export function PosterCard({ item }: { item: CatalogItem }) {
  return (
    <Link
      to="/title/$id"
      params={{ id: item.id }}
      className="group w-[145px] shrink-0 snap-start sm:w-[185px] lg:w-[205px]"
    >
      <div className="poster-card relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-secondary transition duration-300 group-hover:scale-[1.04] group-hover:border-white/25">
        {item.poster ? (
          <img
            src={item.poster}
            alt={`${item.title} poster`}
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center px-2 text-center text-xs text-muted-foreground">
            {item.title}
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-black shadow-lg">
            <Play className="size-3 fill-current" />
            View
          </span>
        </div>
        {item.rating && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/65 px-2 py-1 text-[10px] font-bold text-amber-400 backdrop-blur">
            <Star className="size-2.5 fill-current" />
            {item.rating}
          </span>
        )}
      </div>
      <p className="mt-2 truncate text-sm font-semibold text-foreground">{item.title}</p>
      <p className="text-xs capitalize text-muted-foreground">
        {item.type}
        {item.year ? ` · ${item.year}` : ""}
      </p>
    </Link>
  );
}

function BackdropCard({ item }: { item: CatalogItem }) {
  const img = item.backdrop || item.poster;
  return (
    <div className="group relative aspect-video w-[300px] shrink-0 snap-start overflow-hidden rounded-2xl border border-white/10 bg-secondary shadow-xl transition duration-300 hover:-translate-y-1 hover:border-white/20 sm:w-[360px]">
      {img && <img src={img} alt={item.title} loading="lazy" decoding="async" className="size-full object-cover transition duration-500 group-hover:scale-[1.04]" />}
      <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/25 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
        <p className="truncate text-[11px] capitalize text-foreground/60">
          {item.type}
          {item.year ? ` · ${item.year}` : ""}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <Link to="/title/$id" params={{ id: item.id }} className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background">
            <Play className="size-3.5 fill-current" /> Play
          </Link>
          <Link to="/title/$id" params={{ id: item.id }} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/15 px-3 py-1.5 text-xs font-semibold text-foreground backdrop-blur-md">
            <Info className="size-3.5" /> More info
          </Link>
        </div>
      </div>
    </div>
  );
}

export function CatalogRow({
  title,
  items,
  variant = "poster",
}: {
  title: string;
  items: CatalogItem[];
  variant?: "poster" | "backdrop" | "ranked";
}) {
  if (items.length === 0) return null;

  return (
    <section className="catalog-row mt-12">
      <div className="mb-5 flex items-end justify-between">
        <div className="flex items-center gap-3">
          <span className="h-7 w-1 rounded-full bg-primary shadow-[0_0_14px_var(--primary)]" />
          <h2 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h2>
        </div>
      </div>
      <Scroller label={title}>
        {items.map((item, i) =>
          variant === "backdrop" ? (
            <BackdropCard key={item.id} item={item} />
          ) : variant === "ranked" ? (
            <div key={item.id} className="flex shrink-0 snap-start items-end">
              <span aria-hidden className="-mr-6 select-none text-[110px] font-extrabold leading-none text-transparent sm:text-[150px]" style={{ WebkitTextStroke: "2px oklch(100% 0 0 / 0.25)" }}>
                {i + 1}
              </span>
              <div className="relative w-[145px] shrink-0 sm:w-[185px] lg:w-[205px]">
                <PosterCard item={item} />
                {i < 3 && (
                  <span className="pointer-events-none absolute bottom-[3.4rem] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-primary-foreground shadow-lg">
                    Recently Added
                  </span>
                )}
              </div>
            </div>
          ) : (
            <PosterCard key={item.id} item={item} />
          ),
        )}
      </Scroller>
    </section>
  );
}
