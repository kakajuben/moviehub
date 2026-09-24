import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bookmark } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { PosterCard } from "@/components/CatalogRow";
import { listCatalog } from "@/lib/catalog";
import { useWatchlist } from "@/hooks/useWatchlist";

export const Route = createFileRoute("/my-box")({
  head: () => ({
    meta: [
      { title: "My Box · TryBox" },
      { name: "description", content: "Your saved movies, series and anime on TryBox." },
      { property: "og:title", content: "My Box · TryBox" },
      { property: "og:description", content: "Your saved movies, series and anime on TryBox." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MyBoxPage,
});

function MyBoxPage() {
  const { ids } = useWatchlist();
  const { data: items = [], isLoading } = useQuery({ queryKey: ["catalog"], queryFn: listCatalog });
  const saved = items.filter((i) => ids.includes(i.id));

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h1 className="mb-5 flex items-center gap-2 text-2xl font-bold text-foreground">
          <Bookmark className="size-5 text-primary" /> My Box
        </h1>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : saved.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <p className="text-sm font-semibold text-foreground">Nothing saved yet</p>
            <Link to="/" className="mt-2 inline-block text-xs text-primary hover:underline">
              Browse the catalog
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {saved.map((item) => (
              <PosterCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
