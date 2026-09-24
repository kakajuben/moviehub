import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface VideoSource {
  server: string;
  url: string;
  type?: string;
  downloadUrl?: string;
  /** VK video link used for SnapWC downloads (may differ from the stream url) */
  vkDownloadUrl?: string;
  /** Extra direct file / mirror download link (MP4, Drive, …) */
  mirrorDownloadUrl?: string;
  /** Optional season number for series entries */
  season?: number | null;
  /** Free-form episode label, e.g. "Episode 01" or "Episode 1 to 5 (Batch)" */
  episode?: string;
}

export interface CatalogItem {
  id: string;
  title: string;
  year: number | null;
  imdb_id: string | null;
  rating: string | null;
  poster: string | null;
  backdrop: string | null;
  synopsis: string | null;
  type: "movie" | "series" | "anime";
  stars: string[];
  genres: string[];
  sources: VideoSource[];
  telegram_url: string | null;
  vk_url: string | null;
  created_at: string;
}

export interface CatalogFilterSearch {
  q?: string | undefined;
  star?: string | undefined;
  genre?: string | undefined;
  type?: CatalogItem["type"] | undefined;
}

export function filterCatalog(
  items: CatalogItem[],
  search: CatalogFilterSearch,
): CatalogItem[] {
  const query = search.q?.trim().toLowerCase();
  const star = search.star?.trim().toLowerCase();
  const genre = search.genre?.trim().toLowerCase();

  return items.filter((item) => {
    const stars = item.stars ?? [];
    const genres = item.genres ?? [];

    if (query) {
      const haystack = [
        item.title,
        item.synopsis ?? "",
        item.imdb_id ?? "",
        ...genres,
        ...stars,
      ]
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(query)) return false;
    }

    if (star && !stars.some((itemStar) => itemStar.toLowerCase() === star)) {
      return false;
    }

    if (genre && !genres.some((itemGenre) => itemGenre.toLowerCase() === genre)) {
      return false;
    }

    return !search.type || item.type === search.type;
  });
}

function normalize(row: Record<string, unknown>): CatalogItem {
  const sources = row['sources'];
  return {
    ...(row as unknown as CatalogItem),
    stars: (row['stars'] as string[]) ?? [],
    genres: (row['genres'] as string[]) ?? [],
    sources: Array.isArray(sources) ? (sources as VideoSource[]) : [],
  };
}

export async function listCatalog(): Promise<CatalogItem[]> {
  const { data, error } = await supabase
    .from("catalog_items")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => normalize(r as Record<string, unknown>));
}

export async function getCatalogItem(id: string): Promise<CatalogItem | null> {
  const { data, error } = await supabase
    .from("catalog_items")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? normalize(data as Record<string, unknown>) : null;
}

export type CatalogItemInput = Omit<CatalogItem, "id" | "created_at"> & { id?: string };

export async function saveCatalogItem(input: CatalogItemInput) {
  const payload = {
    title: input.title,
    year: input.year,
    imdb_id: input.imdb_id,
    rating: input.rating,
    poster: input.poster,
    backdrop: input.backdrop,
    synopsis: input.synopsis,
    type: input.type,
    stars: input.stars,
    genres: input.genres,
    sources: input.sources as unknown as Json,
    telegram_url: input.telegram_url,
    vk_url: input.vk_url,
  };

  if (input.id) {
    const { error } = await supabase.from("catalog_items").update(payload).eq("id", input.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("catalog_items").insert(payload);
    if (error) throw error;
  }
}

export async function deleteCatalogItem(id: string) {
  const { error } = await supabase.from("catalog_items").delete().eq("id", id);
  if (error) throw error;
}
