import { useMemo } from "react";

import { CatalogRow } from "@/components/CatalogRow";
import type { CatalogItem } from "@/lib/catalog";

const typeSections = [
  { type: "series" as const, title: "Trending TV Series" },
  { type: "movie" as const, title: "Blockbuster Movies" },
  { type: "anime" as const, title: "Popular Anime" },
];

export function CatalogSections({
  items,
  genres,
}: {
  items: CatalogItem[];
  genres: string[];
}) {
  const itemsByType = useMemo(() => {
    const groups: Record<CatalogItem["type"], CatalogItem[]> = {
      movie: [],
      series: [],
      anime: [],
    };

    for (const item of items) {
      groups[item.type].push(item);
    }

    return groups;
  }, [items]);

  const itemsByGenre = useMemo(() => {
    return new Map(
      genres.slice(0, 10).map((genre) => [
        genre,
        items.filter((item) =>
          (item.genres ?? []).some(
            (itemGenre) => itemGenre.toLowerCase() === genre.toLowerCase(),
          ),
        ),
      ]),
    );
  }, [genres, items]);

  return (
    <div className="mt-7 space-y-10">
      <CatalogRow title="Top 10 Today" items={items.slice(0, 10)} variant="ranked" />

      {typeSections.map(({ type, title }) =>
        itemsByType[type].length > 0 ? (
          <CatalogRow key={type} title={title} items={itemsByType[type]} />
        ) : null,
      )}

      {Array.from(itemsByGenre.entries()).map(([genre, genreItems]) =>
        genreItems.length > 0 ? (
          <CatalogRow key={genre} title={genre} items={genreItems} />
        ) : null,
      )}

      <CatalogRow title="Recently Added" items={items} />
    </div>
  );
}
