# Stream Weaver

prompt for web build. ​Add dedicated columns for actors and genres to enable fast, indexed filtering. (ALTER TABLE public.catalog_items 

ADD COLUMN IF NOT EXISTS stars text[] DEFAULT '{}',

ADD COLUMN IF NOT EXISTS genres text[] DEFAULT '{}';



CREATE INDEX IF NOT EXISTS idx_catalog_items_stars ON public.catalog_items USING GIN (stars);

CREATE INDEX IF NOT EXISTS idx_catalog_items_genres ON public.catalog_items USING GIN (genres);)    1. IMDb Auto-Parser Service (src/lib/imdb.ts)  (export interface ImdbMetadata {

  title: string;

  year: number | null;

  rating: string;

  poster: string;

  backdrop: string;

  synopsis: string;

  type: "movie" | "series" | "anime";

  genres: string[];

  stars: string[];

}



export function extractImdbId(input: string): string | null {

  const match = input.match(/tt\d{7,8}/i);

  return match ? match[0] : null;

}



export async function fetchImdbDetails(

  imdbUrlOrId: string,

  apiKey: string = "trilogy" // Default fallback free key; can be replaced with personal OMDb API key

): Promise<ImdbMetadata> {

  const imdbId = extractImdbId(imdbUrlOrId);

  if (!imdbId) {

    throw new Error("Invalid IMDb URL or ID. Example: https://www.imdb.com/title/tt0944947/");

  }



  const res = await fetch(

    `https://www.omdbapi.com/?i=${imdbId}&plot=full&apikey=${apiKey}`

  );

  

  const data = await res.json();

  if (data.Response === "False") {

    throw new Error(data.Error || "Failed to fetch IMDb details");

  }



  const genres = data.Genre && data.Genre !== "N/A" 

    ? data.Genre.split(",").map((g: string) => g.trim()) 

    : [];



  const stars = data.Actors && data.Actors !== "N/A"

    ? data.Actors.split(",").map((a: string) => a.trim())

    : [];



  return {

    title: data.Title || "",

    year: parseInt(data.Year) || null,

    rating: data.imdbRating !== "N/A" ? data.imdbRating : "",

    poster: data.Poster !== "N/A" ? data.Poster : "",

    backdrop: data.Poster !== "N/A" ? data.Poster : "",

    synopsis: data.Plot !== "N/A" ? data.Plot : "",

    type: data.Type === "series" ? "series" : "movie",

    genres,

    stars,

  };      2. Auto-Populate IMDb Bar in Admin Console.  import { useState } from "react";

import { Sparkles, Loader2 } from "lucide-react";

import { fetchImdbDetails } from "@/lib/imdb";

import { toast } from "sonner";



export function ImdbAutoFill({

  onAutofill,

}: {

  onAutofill: (meta: Record<string, any>) => void;

}) {

  const [imdbInput, setImdbInput] = useState("");

  const [loading, setLoading] = useState(false);



  const handleFetch = async () => {

    if (!imdbInput.trim()) return;

    setLoading(true);

    try {

      const data = await fetchImdbDetails(imdbInput);

      onAutofill({

        title: data.title,

        year: data.year,

        rating: data.rating,

        poster: data.poster,

        backdrop: data.backdrop,

        synopsis: data.synopsis,

        type: data.type,

        stars: data.stars,

        genres: data.genres,

      });

      toast.success("Metadata loaded from IMDb!");

      setImdbInput("");

    } catch (err: any) {

      toast.error(err.message || "Failed to parse IMDb link");

    } finally {

      setLoading(false);

    }

  };



  return (

    <div className="flex flex-col gap-2 rounded-xl border border-indigo-500/30 bg-[#161E2E] p-3 shadow-sm">

      <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">

        Auto-Import from IMDb

      </span>

      <div className="flex gap-2">

        <input

          value={imdbInput}

          onChange={(e) => setImdbInput(e.target.value)}

          placeholder="Paste IMDb link (e.g. https://www.imdb.com/title/tt0944947/)"

          className="flex-1 rounded-xl border border-slate-700/50 bg-[#0F141C] px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"

        />

        <button

          type="button"

          disabled={loading}

          onClick={handleFetch}

          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"

        >

          {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}

          Auto Fill

        </button>

      </div>

    </div>        3. Unified Video Player with Multi-Source & Failover.    import React, { useState, useEffect, useRef } from "react";

import { ExternalLink, Download, Play, AlertCircle } from "lucide-react";



interface VideoSource {

  server: string;

  url: string;

  type?: string;

  downloadUrl?: string;

}



interface VideoPlayerProps {

  sources: VideoSource[];

  telegramUrl?: string;

  vkUrl?: string;

  snapWcUrl?: string;

  title: string;

}



export function VideoPlayer({

  sources = [],

  telegramUrl,

  vkUrl,

  snapWcUrl = "https://snapwc.com/vk",

  title,

}: VideoPlayerProps) {

  const [activeServerIdx, setActiveServerIdx] = useState(0);

  const [hasIframeError, setHasIframeError] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);



  const activeSource = sources[activeServerIdx] || sources[0];

  const isDirectVideo = activeSource?.url?.match(/\.(mp4|webm|mkv|mov)(\?.*)?$/i);



  // Auto-failover listener for blocked iframe embeds (1-second safety trigger)

  useEffect(() => {

    setHasIframeError(false);

    if (!isDirectVideo && activeSource?.url) {

      const timer = setTimeout(() => {

        try {

          if (!iframeRef.current) setHasIframeError(true);

        } catch {

          setHasIframeError(true);

        }

      }, 1000);

      return () => clearTimeout(timer);

    }

  }, [activeSource, isDirectVideo]);



  return (

    <div className="w-full overflow-hidden rounded-2xl border border-slate-700/50 bg-[#0F141C] shadow-2xl">

      {/* Top Bar: Server Switcher & Controls */}

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/40 bg-[#161E2E] px-4 py-3">

        <div className="flex items-center gap-3">

          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Server:</span>

          <select

            value={activeServerIdx}

            onChange={(e) => setActiveServerIdx(Number(e.target.value))}

            className="rounded-lg border border-slate-700 bg-[#0D1117] px-3 py-1.5 text-xs font-medium text-slate-200 focus:border-indigo-500 focus:outline-none"

          >

            {sources.map((s, idx) => (

              <option key={idx} value={idx}>

                {s.server || `Server ${idx + 1}`} ({s.type || "Auto"})

              </option>

            ))}

          </select>

        </div>



        <div className="flex items-center gap-2">

          {activeSource?.downloadUrl && (

            <a

              href={activeSource.downloadUrl}

              target="_blank"

              rel="noopener noreferrer"

              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-[#1C2436] px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700"

            >

              <Download className="size-3.5 text-sky-400" /> Mirror Download

            </a>

          )}

          {activeSource?.url && (

            <a

              href={activeSource.url}

              target="_blank"

              rel="noopener noreferrer"

              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-[#1C2436] px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700"

            >

              <ExternalLink className="size-3.5 text-indigo-400" /> Pop-Out

            </a>

          )}

        </div>

      </div>



      {/* Screen Area */}

      <div className="relative aspect-video w-full bg-black">

        {isDirectVideo ? (

          <video

            key={activeSource.url}

            controls

            playsInline

            className="size-full object-contain"

            src={activeSource.url}

          >

            Your browser does not support the video tag.

          </video>

        ) : hasIframeError ? (

          <div className="flex size-full flex-col items-center justify-center gap-3 bg-[#0D1117] p-6 text-center">

            <AlertCircle className="size-10 text-amber-400" />

            <p className="text-sm font-medium text-slate-200">

              Stream blocked by provider or protected by cross-origin rules.

            </p>

            <button

              onClick={() => window.open(activeSource?.url, "_blank", "noopener,noreferrer")}

              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"

            >

              <ExternalLink className="size-4" /> Open in External Tab

            </button>

          </div>

        ) : (

          <iframe

            ref={iframeRef}

            src={activeSource?.url}

            title={title}

            className="size-full border-0"

            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"

            allowFullScreen

          />

        )}

      </div>



      {/* Bottom External Links / Community Bar */}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-700/40 bg-[#161E2E] px-4 py-2.5">

        <div className="flex items-center gap-2">

          {telegramUrl && (

            <a

              href={telegramUrl}

              target="_blank"

              rel="noopener noreferrer"

              className="flex items-center gap-1 rounded-lg bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-400 hover:bg-sky-500/20"

            >

              Telegram Channel

            </a>

          )}

          {vkUrl && (

            <a

              href={vkUrl}

              target="_blank"

              rel="noopener noreferrer"

              className="flex items-center gap-1 rounded-lg bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-400 hover:bg-indigo-500/20"

            >

              VK Community

            </a>

          )}

        </div>



        {snapWcUrl && (

          <a

            href={snapWcUrl}

            target="_blank"

            rel="noopener noreferrer"

            className="flex items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-white"

          >

            Download via SnapWC

          </a>  4. Clickable Cast & Genre Filtering Bar (src/components/CatalogFilter.tsx)    import React from "react";

import { X, User, Film } from "lucide-react";



interface CatalogFilterProps {

  selectedStar: string | null;

  selectedGenre: string | null;

  onClearStar: () => void;

  onClearGenre: () => void;

}



export function CatalogFilterChips({

  selectedStar,

  selectedGenre,

  onClearStar,

  onClearGenre,

}: CatalogFilterProps) {

  if (!selectedStar && !selectedGenre) return null;



  return (

    <div className="flex flex-wrap items-center gap-2 px-4 py-2">

      <span className="text-xs text-slate-400">Active filters:</span>

      {selectedStar && (

        <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400">

          <User className="size-3" /> Star: {selectedStar}

          <button onClick={onClearStar} className="hover:text-white">

            <X className="size-3.5" />

          </button>

        </span>

      )}

      {selectedGenre && (

        <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-400">

          <Film className="size-3" /> Genre: {selectedGenre}

          <button onClick={onClearGenre} className="hover:text-white">

            <X className="size-3.5" />

          </button>

        </span>

      )}

    </div>

  );

}



        )}

      </div>

    </div>

  );

}



  );

}



}      Upgrade our existing TryBox streaming and catalog app with three synchronized features in one build pass:



1. AUTO-IMDb METADATA FETCHER IN ADMIN:

- Add a new input field at the top of the Admin ItemEditor: "Import from IMDb URL / ID".

- When an IMDb link (e.g., https://www.imdb.com/title/tt0944947/) or tt-id is pasted and clicked, automatically query the OMDb API (`https://www.omdbapi.com/?i=${imdbId}&plot=full&apikey=trilogy`) or client parser.

- Auto-fill the following fields in the editor without reloading: Title, Release Year, IMDb Rating, Poster URL, Backdrop URL, Synopsis, Content Type (movie/series), Genres (array/tags), and Stars/Cast (array/tags).



2. CLICKABLE CAST & GENRE FILTERING:

- In the item detail modal and card view, display Actor/Star names and Genre chips.

- Clicking any Actor chip or Genre chip immediately filters the public catalog to show all movies/series featuring that exact star or genre.

- Add an active filter bar showing the selected star/genre tag with a quick "X" button to clear the filter.



3. RESILIENT VIDEO PLAYER & FAILOVER:

- Ensure the integrated video player supports direct HTML5 streams (MP4, WebM VP9) and embedded sources (VK, iframe links, Telegram).

- Add a 1-second auto-detection timeout for iframes: if an iframe fails or is blocked by X-Frame-Options, display a fallback card: "Stream blocked by provider — Opening in external browser..." with a button triggering `window.open(source.url, '_blank')`.

- Maintain external buttons for "Telegram Channel", "VK Community", and "Download via SnapWC (https://snapwc.com/vk)" opening in new tabs.



Preserve the slate-charcoal aesthetic (#0F141C, #161E2E, #6366F1), existing Supabase database schema, and TanStack Router setup.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://kino-sync.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4a72ab50-e55e-4773-816e-0f52ba42bf17).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
