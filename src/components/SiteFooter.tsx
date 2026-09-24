import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border/60 bg-card/40">
      <div className="mx-auto grid max-w-[1400px] gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <span className="text-lg font-extrabold tracking-[0.18em] text-primary">TRYBOX</span>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Movies and series, catalogued and streamable. TryBox doesn't host anything — all streams
            and metadata come from third parties.
          </p>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Browse
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/" search={{ type: undefined }} className="hover:text-foreground">
                Home
              </Link>
            </li>
            <li>
              <Link to="/" search={{ type: "movie" }} className="hover:text-foreground">
                Movies
              </Link>
            </li>
            <li>
              <Link to="/" search={{ type: "series" }} className="hover:text-foreground">
                TV Shows
              </Link>
            </li>
            <li>
              <Link to="/" search={{ type: "anime" }} className="hover:text-foreground">
                Anime
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Account
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/auth" className="hover:text-foreground">
                Sign in
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Community
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">© 2026 TryBox</p>
        </div>
      </div>
    </footer>
  );
}
