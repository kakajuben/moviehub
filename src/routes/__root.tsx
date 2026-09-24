import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import premiumCss from "../premium-ui.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

function NotFoundComponent() {
  return (
    <div className="premium-error flex min-h-screen items-center justify-center px-4">
      <div className="trybox-glass max-w-md rounded-3xl p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          TryBox
        </p>

        <h1 className="mt-3 font-display text-7xl font-extrabold text-foreground">
          404
        </h1>

        <h2 className="mt-4 text-xl font-semibold text-foreground">
          Page not found
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          The page you are looking for does not exist or has moved.
        </p>

        <Link
          to="/"
          className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:-translate-y-0.5 hover:bg-primary/90"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);

    void reportLovableError(error, {
      boundary: "tanstack_root_error_component",
    });
  }, [error]);

  return (
    <div className="premium-error flex min-h-screen items-center justify-center px-4">
      <div className="trybox-glass max-w-md rounded-3xl p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          TryBox
        </p>

        <h1 className="mt-3 text-xl font-semibold text-foreground">
          This page didn’t load
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong. Try again or return home.
        </p>

        <div className="mt-6 flex justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:-translate-y-0.5 hover:bg-primary/90"
          >
            Try again
          </button>

          <Link
            to="/"
            className="rounded-xl border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accent"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1.0, viewport-fit=cover",
      },
      { title: "TryBox — Stream Movies, Series & Anime" },
      {
        name: "description",
        content:
          "Discover movies, series, and anime in a premium streaming catalog with instant search and watchlist support.",
      },
      { name: "theme-color", content: "#100d14" },
      { name: "color-scheme", content: "dark" },
      { property: "og:site_name", content: "TryBox" },
      { property: "og:title", content: "TryBox — Stream Movies, Series & Anime" },
      {
        property: "og:description",
        content: "Discover your next movie, series, or anime in TryBox.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/apple-touch-icon.png" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "TryBox — Stream Movies, Series & Anime",
      },
      {
        name: "twitter:description",
        content: "Discover your next movie, series, or anime in TryBox.",
      },
      { name: "twitter:image", content: "/apple-touch-icon.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: premiumCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Sora:wght@400;500;600;700;800&display=swap",
      },
      { rel: "icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],
  }),

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (
        event !== "SIGNED_IN" &&
        event !== "SIGNED_OUT" &&
        event !== "USER_UPDATED"
      ) {
        return;
      }

      void router.invalidate();

      if (event !== "SIGNED_OUT") {
        void queryClient.invalidateQueries();
      }
    });

    return () => data.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      <Outlet />

      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}
