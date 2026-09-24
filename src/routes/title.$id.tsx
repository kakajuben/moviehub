import { useMemo, useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Star, Play } from "lucide-react";
import { getCatalogItem, listCatalog } from "@/lib/catalog";
import { VideoPlayer } from "@/components/VideoPlayer";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/title/$id")({
  head: () => ({
    meta: [
      { title: "Watch on TryBox" },
      { name: "description", content: "Stream this title on TryBox with multiple servers, cast and genre browsing." },
      { property: "og:title", content: "Watch on TryBox" },
      { property: "og:description", content: "Stream this title on TryBox with multiple servers." },
      { property: "og:type", content: "video.other" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TitlePage,
  errorComponent: () => <p className="p-10 text-center text-sm text-destructive">This title could not be loaded.</p>,
  notFoundComponent: () => <p className="p-10 text-center text-sm">Title not found.</p>,
});

const SNAPWC = "https://snapwc.com/vk";

function TitlePage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const [playerOpen, setPlayerOpen] = useState(false);
  const { data: item, isLoading } = useQuery({ queryKey: ["catalog", id], queryFn: () => getCatalogItem(id) });
  const { data: all } = useQuery({ queryKey: ["catalog"], queryFn: listCatalog });

  const related = useMemo(() => {
    if (!item || !all) return [];
    return all.filter((c) => c.id !== item.id && (c.type === item.type || c.genres.some((g) => item.genres.includes(g)))).slice(0, 8);
  }, [item, all]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background px-4 pt-28">
        <div className="skeleton mx-auto h-8 w-24 rounded-lg" />
        <div className="mx-auto mt-8 max-w-6xl rounded-3xl border border-border/60 p-6 sm:p-10">
          <div className="flex flex-col gap-8 sm:flex-row"><div className="skeleton h-72 w-48 rounded-2xl" /><div className="flex-1 space-y-4"><div className="skeleton h-12 w-3/4 rounded-lg" /><div className="skeleton h-5 w-1/2 rounded-lg" /><div className="skeleton h-24 w-full rounded-lg" /></div></div>
        </div>
      </div>
    );
  }
  if (!item) return <p className="p-10 text-center text-sm text-muted-foreground">Title not found.</p>;

  const artwork = item.poster;

  return (
    <div className="relative isolate min-h-screen overflow-x-hidden">
      {artwork && (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <img
            src={artwork}
            alt=""
            fetchPriority="high"
            decoding="async"
            className="size-full scale-150 object-cover opacity-60 blur-[100px] saturate-[2.2]"
          />
          <div className="absolute inset-0 bg-background/25" />
          <div className="absolute inset-0 bg-[radial-gradient(75%_60%_at_50%_20%,transparent,oklch(0%_0_0_/_0.45))]" />
        </div>
      )}

      <SiteHeader />

      <main id="main-content" className="relative isolate mx-auto max-w-6xl px-4 pb-16 pt-24 sm:pt-28">
        <button
          type="button"
          onClick={() => router.history.back()}
          aria-label="Go back"
          className="group mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-foreground/90 shadow-md backdrop-blur-md transition hover:border-white/30 hover:bg-white/20 hover:text-foreground"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Back</span>
        </button>


        <div className="trybox-glass relative rounded-3xl border border-white/15 bg-white/[0.06] p-5 shadow-2xl ring-1 ring-white/10 backdrop-blur-2xl sm:p-8">
          <div className="flex flex-col gap-8 sm:flex-row">
            {item.poster && <img src={item.poster} alt={`${item.title} poster`} loading="eager" decoding="async" className="w-40 shrink-0 aspect-[2/3] rounded-2xl rounded-2xl object-cover shadow-2xl ring-1 ring-white/10 sm:w-[220px]" />}
            <div className="flex-1">
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">{item.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground"><span className="rounded-full border border-border bg-white/5 px-3 py-1 uppercase tracking-wider">{item.type}</span>{item.year && <span>{item.year}</span>}{item.rating && <span className="inline-flex items-center gap-1 text-amber-400"><Star className="size-3 fill-current" /> {item.rating}</span>}</div>
              {item.synopsis && <p className="mt-5 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">{item.synopsis}</p>}
              <div className="mt-7 flex flex-wrap items-center gap-3"><button type="button" onClick={() => setPlayerOpen((v) => !v)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-[0_0_18px_rgba(168,85,247,0.35)] transition hover:brightness-110"><Play className="size-4 fill-current" />{playerOpen ? "Hide servers" : "Watch now"}</button></div>
              <div className="mt-4 flex flex-wrap items-center gap-2">{item.telegram_url && <a href={item.telegram_url} target="_blank" rel="noopener noreferrer" className="rounded-full bg-sky-brand/10 px-3 py-1.5 text-xs font-medium text-sky-brand transition hover:bg-sky-brand/20">Telegram</a>}{item.vk_url && <a href={item.vk_url} target="_blank" rel="noopener noreferrer" className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/20">VK Proxy</a>}<a href={SNAPWC} target="_blank" rel="noopener noreferrer" className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground">SnapWC</a></div>
              {item.genres.length > 0 && <div className="mt-6 flex flex-wrap gap-2">{item.genres.map((g) => <Link key={g} to="/" search={{ genre: g }} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white/5 px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground">{g}</Link>)}</div>}
              {item.stars.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{item.stars.map((s) => <Link key={s} to="/" search={{ q: s }} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white/5 px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground">{s}</Link>)}</div>}
            </div>
          </div>
        </div>

        {playerOpen && <div className="mt-8"><VideoPlayer sources={item.sources} telegramUrl={item.telegram_url} vkUrl={item.vk_url} title={item.title} onClose={() => setPlayerOpen(false)} /></div>}
        {related.length > 0 && <section className="catalog-row mt-14"><div className="mb-5 flex items-center gap-3"><span className="h-7 w-1 rounded-full bg-primary shadow-[0_0_14px_var(--primary)]" /><h2 className="font-display text-2xl font-bold text-foreground">Related titles</h2></div><div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{related.map((r) => <Link key={r.id} to="/title/$id" params={{ id: r.id }} className="group w-36 shrink-0 snap-start sm:w-44"><div className="poster-card overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition group-hover:-translate-y-1">{r.poster && <img src={r.poster} alt={r.title} className="h-52 w-full object-cover sm:h-64" />}<div className="space-y-1 p-3"><p className="truncate text-sm font-semibold text-foreground">{r.title}</p><p className="text-[11px] text-muted-foreground">{r.type}</p></div></div></Link>)}</div></section>}
      </main>
    </div>
  );
}
