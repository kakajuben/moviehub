export interface ImdbEpisode {
  season: number;
  episode: string;
}

export interface ImdbMetadata {
  imdbId: string;
  title: string;
  year: number | null;
  rating: string;
  poster: string;
  backdrop: string;
  synopsis: string;
  type: "movie" | "series" | "anime";
  genres: string[];
  stars: string[];
  totalSeasons: number;
  episodes: ImdbEpisode[];
}

async function fetchSeasonEpisodes(
  imdbId: string,
  season: number,
  apiKey: string,
): Promise<ImdbEpisode[]> {
  try {
    const res = await fetch(
      `https://www.omdbapi.com/?i=${imdbId}&Season=${season}&apikey=${apiKey}`,
    );
    const data = (await res.json()) as {
      Episodes?: { Title?: string; Episode?: string }[];
      Response?: string;
    };
    if (data.Response === "False" || !Array.isArray(data.Episodes)) return [];
    return data.Episodes.map((ep, idx) => {
      const num = ep.Episode ?? String(idx + 1);
      const padded = num.padStart(2, "0");
      const name = ep.Title && ep.Title !== "N/A" ? ` — ${ep.Title}` : "";
      return { season, episode: `Episode ${padded}${name}` };
    });
  } catch {
    return [];
  }
}

export function extractImdbId(input: string): string | null {
  const match = input.match(/tt\d{7,8}/i);
  return match ? match[0] : null;
}

export async function fetchImdbDetails(
  imdbUrlOrId: string,
  apiKey = "trilogy",
): Promise<ImdbMetadata> {
  const imdbId = extractImdbId(imdbUrlOrId);
  if (!imdbId) {
    throw new Error("Invalid IMDb URL or ID. Example: https://www.imdb.com/title/tt0944947/");
  }

  const res = await fetch(`https://www.omdbapi.com/?i=${imdbId}&plot=full&apikey=${apiKey}`);
  const data = (await res.json()) as Record<string, string>;

  if (data['Response'] === "False") {
    throw new Error(data['Error'] || "Failed to fetch IMDb details");
  }

  const split = (value?: string) =>
    value && value !== "N/A" ? value.split(",").map((v) => v.trim()).filter(Boolean) : [];

  const genres = split(data['Genre']);
  const stars = split(data['Actors']);
  const isAnime = genres.some((g) => g.toLowerCase() === "animation");
  const rawType = data['Type'];
  const isSeries = rawType === "series";
  const totalSeasons = isSeries ? parseInt(data['totalSeasons'] ?? "", 10) || 0 : 0;

  const episodes: ImdbEpisode[] = [];
  if (totalSeasons > 0) {
    const seasons = Array.from({ length: Math.min(totalSeasons, 20) }, (_, i) => i + 1);
    const results = await Promise.all(
      seasons.map((s) => fetchSeasonEpisodes(imdbId, s, apiKey)),
    );
    for (const list of results) episodes.push(...list);
  }

  return {
    imdbId,
    title: data['Title'] || "",
    year: parseInt(data['Year'] ?? "", 10) || null,
    rating: data['imdbRating'] && data['imdbRating'] !== "N/A" ? data['imdbRating'] : "",
    poster: data['Poster'] && data['Poster'] !== "N/A" ? data['Poster'] : "",
    backdrop: data['Poster'] && data['Poster'] !== "N/A" ? data['Poster'] : "",
    synopsis: data['Plot'] && data['Plot'] !== "N/A" ? data['Plot'] : "",
    type: isAnime ? "anime" : rawType === "series" ? "series" : "movie",
    genres,
    stars,
    totalSeasons,
    episodes,
  };
}
