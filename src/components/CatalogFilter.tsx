import { X, User, Film, Search } from "lucide-react";

interface CatalogFilterChipsProps {
  selectedStar?: string | undefined;
  selectedGenre?: string | undefined;
  onClearStar: () => void;
  onClearGenre: () => void;
}

export function CatalogFilterChips({
  selectedStar,
  selectedGenre,
  onClearStar,
  onClearGenre,
}: CatalogFilterChipsProps) {
  if (!selectedStar && !selectedGenre) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 py-2">
      <span className="text-xs text-muted-foreground">Active filters:</span>
      {selectedStar && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <User className="size-3" /> Star: {selectedStar}
          <button onClick={onClearStar} aria-label="Clear star filter" className="hover:text-foreground">
            <X className="size-3.5" />
          </button>
        </span>
      )}
      {selectedGenre && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-brand/30 bg-sky-brand/10 px-3 py-1 text-xs font-medium text-sky-brand">
          <Film className="size-3" /> Genre: {selectedGenre}
          <button onClick={onClearGenre} aria-label="Clear genre filter" className="hover:text-foreground">
            <X className="size-3.5" />
          </button>
        </span>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// NEW COMPONENT: Dynamic Categories Dropdown for index.tsx tabs
// -------------------------------------------------------------
interface CategoryDropdownProps {
  genres: string[];
  selectedGenre: string | undefined;
  onSelectGenre: (genre: string | undefined) => void;
}

export function CategoryDropdown({
  genres,
  selectedGenre,
  onSelectGenre,
}: CategoryDropdownProps) {
  return (
    <select
      className="cursor-pointer appearance-none rounded-lg border border-border bg-card/60 px-4 py-1.5 text-sm font-medium text-foreground outline-none transition-colors hover:border-primary focus:border-primary"
      value={selectedGenre || "all"}
      onChange={(e) => onSelectGenre(e.target.value === "all" ? undefined : e.target.value)}
    >
      <option value="all">All Categories</option>
      {genres.map((g) => (
        <option key={g} value={g}>
          {g}
        </option>
      ))}
    </select>
  );
}

// -------------------------------------------------------------
// ORIGINAL FILTER COMPONENT (Retained for completeness)
// -------------------------------------------------------------
const TYPES = ["All", "Movie", "Series", "Anime"];

interface CatalogFilterProps {
  selectedType: string;
  onSelectType: (t: string) => void;
  selectedGenre: string;
  onSelectGenre: (g: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  genres?: string[];
}

export function CatalogFilter({
  selectedType,
  onSelectType,
  selectedGenre,
  onSelectGenre,
  searchQuery,
  onSearchChange,
  genres = [],
}: CatalogFilterProps) {
  const genreOptions = ["All", ...genres];

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id="catalog-search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search titles or actors…"
          className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <button
            key={t}
            onClick={() => onSelectType(t)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              selectedType === t
                ? "border-primary bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {genres.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {genreOptions.map((g) => (
            <button
              key={g}
              onClick={() => onSelectGenre(g)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                selectedGenre === g
                  ? "border-sky-brand bg-sky-brand/15 text-sky-brand"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
