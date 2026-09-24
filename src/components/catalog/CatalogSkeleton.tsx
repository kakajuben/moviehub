import type { CatalogItem } from "@/lib/catalog";

function SkeletonRow() {
  return (
    <section className="space-y-4">
      <div className="skeleton h-7 w-48 rounded-md" />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="skeleton aspect-[2/3] w-[145px] shrink-0 rounded-2xl sm:w-[185px]" />
        ))}
      </div>
    </section>
  );
}

export function CatalogSkeleton() {
  return (
    <div className="space-y-10" aria-label="Loading catalog">
      <div className="skeleton h-[55vh] min-h-[420px] rounded-3xl" />
      <SkeletonRow />
      <SkeletonRow />
      <SkeletonRow />
    </div>
  );
}

export function TitleSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 pt-28">
      <div className="skeleton h-8 w-24 rounded-lg" />
      <div className="trybox-glass rounded-3xl p-6 sm:p-10">
        <div className="flex flex-col gap-8 sm:flex-row">
          <div className="skeleton h-72 w-48 rounded-2xl" />
          <div className="flex-1 space-y-4">
            <div className="skeleton h-12 w-3/4 rounded-lg" />
            <div className="skeleton h-24 w-full rounded-lg" />
            <div className="skeleton h-12 w-40 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export type { CatalogItem };
