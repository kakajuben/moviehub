import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, Save, X } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { ImdbAutoFill } from "@/components/ImdbAutoFill";
import { useAuth } from "@/hooks/useAuth";
import {
  listCatalog,
  saveCatalogItem,
  deleteCatalogItem,
  type CatalogItem,
  type CatalogItemInput,
  type VideoSource,
} from "@/lib/catalog";

export const Route = createFileRoute("/_authenticated/admin")({
  validateSearch: (search: Record<string, unknown>): { action?: string | undefined } => ({
    action: typeof search["action"] === "string" ? search["action"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Admin console — TryBox" },
      { name: "description", content: "Add and edit TryBox catalog entries with IMDb auto-import." },
      { property: "og:title", content: "Admin console — TryBox" },
      { property: "og:description", content: "Manage the TryBox catalog." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

const emptyItem: CatalogItemInput = {
  title: "",
  year: null,
  imdb_id: null,
  rating: "",
  poster: "",
  backdrop: "",
  synopsis: "",
  type: "movie",
  stars: [],
  genres: [],
  sources: [],
  telegram_url: "",
  vk_url: "",
};

const inputCls =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none";
const labelCls = "text-xs font-medium uppercase tracking-wide text-muted-foreground";

function AdminPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  
  const { isAdmin, loading } = useAuth();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<CatalogItemInput | null>(null);

  const { data: items } = useQuery({ queryKey: ["catalog"], queryFn: listCatalog });

  // If the user clicked "+ Add New Title", immediately initialize the draft
  useEffect(() => {
    if (search.action === "new") {
      setDraft({ ...emptyItem });
      // Remove the action from URL so refreshing doesn't reset a partially filled form
      navigate({ to: "/admin", search: {}, replace: true });
    }
  }, [search.action, navigate]);

  const save = useMutation({
    mutationFn: saveCatalogItem,
    onSuccess: () => {
      toast.success("Saved");
      setDraft(null);
      void queryClient.invalidateQueries({ queryKey: ["catalog"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: deleteCatalogItem,
    onSuccess: () => {
      toast.success("Deleted");
      void queryClient.invalidateQueries({ queryKey: ["catalog"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const patch = (next: Partial<CatalogItemInput>) =>
    setDraft((prev) => ({ ...(prev ?? emptyItem), ...next }));

  const setSource = (idx: number, next: Partial<VideoSource>) =>
    patch({
      sources: (draft?.sources ?? []).map((s, i) => (i === idx ? { ...s, ...next } : s)),
    });

  if (loading) return <p className="p-10 text-center text-sm text-muted-foreground">Loading…</p>;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <p className="p-10 text-center text-sm text-muted-foreground">
          This account doesn't have admin access to the catalog.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-6 pt-24">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Admin console</h1>
          <button
            onClick={() => setDraft({ ...emptyItem })}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
          >
            <Plus className="size-3.5" /> New item
          </button>
        </div>

        {draft && (
          <section className="mt-5 space-y-4 rounded-2xl border border-border bg-card p-4">
            <ImdbAutoFill
              onAutofill={(meta) =>
                patch({
                  title: meta.title,
                  year: meta.year,
                  imdb_id: meta.imdbId,
                  rating: meta.rating,
                  poster: meta.poster,
                  backdrop: meta.backdrop,
                  synopsis: meta.synopsis,
                  type: meta.type,
                  stars: meta.stars,
                  genres: meta.genres,
                  ...(meta.episodes.length
                    ? {
                        sources: meta.episodes.map((ep) => ({
                          server: `S${ep.season} ${ep.episode}`,
                          url: "",
                          type: "Auto",
                          downloadUrl: "",
                          season: ep.season,
                          episode: ep.episode,
                        })),
                      }
                    : {}),
                })
              }
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Title</label>
                <input className={inputCls} value={draft.title} onChange={(e) => patch({ title: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Release year</label>
                <input
                  className={inputCls}
                  value={draft.year ?? ""}
                  onChange={(e) => patch({ year: e.target.value ? Number(e.target.value) : null })}
                />
              </div>
              <div>
                <label className={labelCls}>IMDb rating</label>
                <input className={inputCls} value={draft.rating ?? ""} onChange={(e) => patch({ rating: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Content type</label>
                <select
                  className={inputCls}
                  value={draft.type}
                  onChange={(e) => patch({ type: e.target.value as CatalogItem["type"] })}
                >
                  <option value="movie">movie</option>
                  <option value="series">series</option>
                  <option value="anime">anime</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Poster URL</label>
                <input className={inputCls} value={draft.poster ?? ""} onChange={(e) => patch({ poster: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Backdrop URL</label>
                <input className={inputCls} value={draft.backdrop ?? ""} onChange={(e) => patch({ backdrop: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Synopsis</label>
                <textarea
                  rows={3}
                  className={inputCls}
                  value={draft.synopsis ?? ""}
                  onChange={(e) => patch({ synopsis: e.target.value })}
                />
              </div>
              <div>
                <label className={labelCls}>Genres (comma separated)</label>
                <input
                  className={inputCls}
                  value={draft.genres.join(", ")}
                  onChange={(e) =>
                    patch({ genres: e.target.value.split(",").map((v) => v.trim()).filter(Boolean) })
                  }
                />
              </div>
              <div>
                <label className={labelCls}>Stars / cast (comma separated)</label>
                <input
                  className={inputCls}
                  value={draft.stars.join(", ")}
                  onChange={(e) =>
                    patch({ stars: e.target.value.split(",").map((v) => v.trim()).filter(Boolean) })
                  }
                />
              </div>
              <div>
                <label className={labelCls}>Telegram channel URL</label>
                <input
                  className={inputCls}
                  value={draft.telegram_url ?? ""}
                  onChange={(e) => patch({ telegram_url: e.target.value })}
                />
              </div>
              <div>
                <label className={labelCls}>VK community URL</label>
                <input className={inputCls} value={draft.vk_url ?? ""} onChange={(e) => patch({ vk_url: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={labelCls}>Video sources / episodes</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const maxSeason = draft.sources.reduce(
                        (m, s) => Math.max(m, typeof s.season === "number" ? s.season : 0),
                        0,
                      );
                      patch({
                        sources: [
                          ...draft.sources,
                          { server: `S${maxSeason + 1} Episode 01`, url: "", type: "Auto", season: maxSeason + 1, episode: "Episode 01" },
                        ],
                      });
                    }}
                    className="rounded-lg border border-border px-2.5 py-1 text-xs text-foreground hover:bg-accent"
                  >
                    + Add season
                  </button>
                  <button
                    onClick={() =>
                      patch({ sources: [...draft.sources, { server: `Server ${draft.sources.length + 1}`, url: "", type: "Auto" }] })
                    }
                    className="rounded-lg border border-border px-2.5 py-1 text-xs text-foreground hover:bg-accent"
                  >
                    + Add episode / source
                  </button>
                </div>
              </div>
              {draft.sources.map((s, idx) => (
                <div key={idx} className="grid gap-2 rounded-xl border border-border p-2 sm:grid-cols-4">
                  <input className={inputCls} placeholder="Server name" value={s.server} onChange={(e) => setSource(idx, { server: e.target.value })} />
                  <input
                    className={inputCls}
                    placeholder="Season number (optional)"
                    value={s.season ?? ""}
                    onChange={(e) => setSource(idx, { season: e.target.value ? Number(e.target.value) : null })}
                  />
                  <input
                    className={inputCls}
                    placeholder='Episode label e.g. "Episode 1 to 5 (Batch)"'
                    value={s.episode ?? ""}
                    onChange={(e) => setSource(idx, { episode: e.target.value })}
                  />
                  <input className={inputCls} placeholder="Stream URL (mp4 / iframe / VK)" value={s.url} onChange={(e) => setSource(idx, { url: e.target.value })} />
                  <input className={inputCls} placeholder="Type (MP4, Embed…)" value={s.type ?? ""} onChange={(e) => setSource(idx, { type: e.target.value })} />
                  <div className="flex gap-2 sm:col-span-2">
                    <input
                      className={inputCls}
                      placeholder="VK URL (SnapWC) — link used for downloads"
                      value={s.vkDownloadUrl ?? ""}
                      onChange={(e) => setSource(idx, { vkDownloadUrl: e.target.value })}
                    />
                    <button
                      onClick={async () => {
                        const link = s.vkDownloadUrl || s.url;
                        if (!link) {
                          toast.error("Add a VK or stream link first");
                          return;
                        }
                        try {
                          await navigator.clipboard.writeText(link);
                          toast.success("VK link copied! Paste into SnapWC to download");
                        } catch {
                          toast.error("Could not copy the link");
                        }
                        window.open("https://snapwc.com/vk", "_blank", "noopener,noreferrer");
                      }}
                      className="shrink-0 rounded-lg border border-border px-2.5 text-xs text-foreground hover:bg-accent"
                    >
                      Test / Copy
                    </button>
                  </div>
                  <div className="flex gap-2 sm:col-span-2">
                    {s.mirrorDownloadUrl === undefined ? (
                      <button
                        onClick={() => setSource(idx, { mirrorDownloadUrl: "" })}
                        className="rounded-lg border border-border px-2.5 py-1 text-xs text-foreground hover:bg-accent"
                      >
                        + Add Mirror Download URL
                      </button>
                    ) : (
                      <input
                        className={inputCls}
                        placeholder="Mirror download URL (MP4, Drive…)"
                        value={s.mirrorDownloadUrl}
                        onChange={(e) => setSource(idx, { mirrorDownloadUrl: e.target.value })}
                      />
                    )}
                    <button
                      onClick={() => patch({ sources: draft.sources.filter((_, i) => i !== idx) })}
                      className="ml-auto shrink-0 rounded-lg border border-border px-2 text-destructive"
                      aria-label="Remove source"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => save.mutate(draft)}
                disabled={!draft.title || save.isPending}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                <Save className="size-4" /> Save
              </button>
              <button
                onClick={() => setDraft(null)}
                className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" /> Cancel
              </button>
            </div>
          </section>
        )}

        <section className="mt-6 space-y-2">
          {(items ?? []).map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
            >
              {item.poster && (
                <img src={item.poster} alt="" className="h-14 w-10 rounded object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {item.type} · {item.year ?? "—"} · {item.genres.join(", ")}
                </p>
              </div>
              <button
                onClick={() => setDraft({ ...item })}
                className="rounded-lg border border-border p-2 text-muted-foreground hover:text-foreground"
                aria-label="Edit"
              >
                <Pencil className="size-4" />
              </button>
              <button
                onClick={() => remove.mutate(item.id)}
                className="rounded-lg border border-border p-2 text-destructive"
                aria-label="Delete"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
