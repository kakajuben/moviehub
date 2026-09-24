import { useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { CatalogFilterChips, CategoryDropdown } from "@/components/CatalogFilter";
import { CatalogHero } from "@/components/catalog/CatalogHero";
import { CatalogSections } from "@/components/catalog/CatalogSections";
import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";
import { FilteredGrid } from "@/components/catalog/FilteredGrid";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { listCatalog } from "@/lib/catalog";
import { filterCatalog } from "@/lib/catalogFilters";
import { useAuth } from "@/hooks/useAuth";
import { useWatchlist } from "@/hooks/useWatchlist";

export type CatalogSearch = {
  q?: string | undefined;
  star?: string | undefined;
  genre?: string | undefined;
  type?: "movie" | "series" | "anime" | undefined;
};

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): CatalogSearch => ({
    q: typeof search["q"] === "string" ? search["q"] : undefined,
    star: typeof search["star"] === "string" ? search["star"] : undefined,
    genre: typeof search["genre"] === "string" ? search["genre"] : undefined,
    type:
      search["type"] === "movie" || search["type"] === "series" || search["type"] === "anime"
        ? search["type"]
        : undefined,
  }),
  head: () => ({ meta: [
    { title: "TryBox — Stream Movies, Series & Anime" },
    { name: "description", content: "Browse and stream movies, series and anime on TryBox." },
    { property: "og:title", content: "TryBox — Stream Movies, Series & Anime" },
    { property: "og:description", content: "Browse movies, series and anime with instant catalog filtering." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: CatalogPage,
});

function CatalogPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const { isAdmin } = useAuth();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["catalog"], queryFn: listCatalog, staleTime: 15_000, retry: 2 });
  const all = data ?? [];
  const genres = useMemo(() => Array.from(new Set(all.filter((item) => !search.type || item.type === search.type).flatMap((item) => item.genres ?? []))).sort((a, b) => a.localeCompare(b)), [all, search.type]);
  const items = useMemo(() => filterCatalog(all, search), [all, search.q, search.star, search.genre, search.type]);
  const hero = items[0];
  const isHeroSaved = hero ? isInWatchlist(hero.id) : false;
  const isFilteredView = Boolean(search.type || search.genre || search.q || search.star);
  const showHero = !isLoading && !error && Boolean(hero) && !isFilteredView;
  const activeTab = search.type === "movie" ? "movies" : search.type === "series" ? "tv" : search.type === "anime" ? "anime" : "home";
  const setSearch = (next: Partial<CatalogSearch>) => void navigate({ search: (previous) => ({ ...previous, ...next }) });
  const clearAll = () => void navigate({ search: {} });

  return (
    <div className="min-h-screen text-foreground selection:bg-primary selection:text-primary-foreground">
      <SiteHeader active={activeTab} />
      {isLoading && <div className="mx-auto max-w-[1400px] px-5 pt-24" role="status" aria-live="polite"><CatalogSkeleton /></div>}
      {error && <div className="py-32 text-center" role="alert"><p className="text-sm text-destructive">Could not load the catalog.</p><button type="button" onClick={() => void refetch()} className="mt-4 rounded-xl border border-border px-4 py-2 text-sm transition hover:bg-accent">Try again</button></div>}
      {showHero && hero && <CatalogHero item={hero} isSaved={isHeroSaved} isAdmin={isAdmin} onToggleWatchlist={() => void toggleWatchlist(hero.id)} />}

      <main id="main-content" className={`pb-16 ${showHero ? "" : "pt-24"}`}>
        <div className="mx-auto max-w-[1400px] px-5">
          {isFilteredView && <div className="mt-7 flex items-center justify-between gap-4"><p className="text-xs text-muted-foreground"><strong className="text-foreground">{items.length}</strong> {items.length === 1 ? "title" : "titles"} found</p><button type="button" onClick={clearAll} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"><X className="size-3.5" /> Clear filters</button></div>}
          <CatalogFilterChips selectedStar={search.star} selectedGenre={search.genre} onClearStar={() => setSearch({ star: undefined })} onClearGenre={() => setSearch({ genre: undefined })} />
          {search.type && <section className="mt-5 flex items-center justify-between rounded-2xl border border-border bg-card/30 px-4 py-3"><div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><SlidersHorizontal className="size-4 text-primary" /> Filter by Category</div><CategoryDropdown genres={genres} selectedGenre={search.genre} onSelectGenre={(genre) => setSearch({ genre })} /></section>}
          {search.q && <div className="mt-5 flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"><Search className="size-4 text-muted-foreground" /><span className="text-sm text-foreground">Search results for <strong>“{search.q}”</strong></span></div>}
          {!isLoading && !error && items.length === 0 && <div className="trybox-glass mx-auto mt-12 max-w-md rounded-2xl p-8 text-center"><h2 className="font-display text-lg font-semibold text-foreground">No titles found</h2><p className="mt-2 text-sm text-muted-foreground">Try a different search, genre, or category.</p><button type="button" onClick={clearAll} className="mt-5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Clear filters</button></div>}
          {!isLoading && !error && items.length > 0 && (isFilteredView ? <FilteredGrid items={items} /> : <CatalogSections items={items} genres={genres} />)}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
