import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fetchImdbDetails, type ImdbMetadata } from "@/lib/imdb";

export function ImdbAutoFill({ onAutofill }: { onAutofill: (meta: ImdbMetadata) => void }) {
  const [imdbInput, setImdbInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFetch = async () => {
    if (!imdbInput.trim()) return;
    setLoading(true);
    try {
      const data = await fetchImdbDetails(imdbInput);
      onAutofill(data);
      toast.success("Metadata loaded from IMDb!");
      setImdbInput("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to parse IMDb link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-primary/30 bg-card p-3 shadow-sm">
      <span className="text-xs font-semibold uppercase tracking-wider text-primary">
        Import from IMDb URL / ID
      </span>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={imdbInput}
          onChange={(e) => setImdbInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleFetch();
            }
          }}
          placeholder="Paste IMDb link (e.g. https://www.imdb.com/title/tt0944947/)"
          className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
        <button
          type="button"
          disabled={loading}
          onClick={() => void handleFetch()}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          Auto Fill
        </button>
      </div>
    </div>
  );
}
