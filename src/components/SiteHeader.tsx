import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import {
  Search,
  UserRound,
  Shield,
  LogIn,
  LogOut,
  Bookmark,
  FileEdit,
  Menu,
  X,
  Plus,
  ChevronRight,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type SiteHeaderProps = {
  active?: "home" | "movies" | "tv" | "anime";
};

const NAV_LINKS = [
  {
    id: "home",
    label: "Home",
    type: undefined,
  },
  {
    id: "movies",
    label: "Movies",
    type: "movie",
  },
  {
    id: "tv",
    label: "TV Series",
    type: "series",
  },
  {
    id: "anime",
    label: "Anime",
    type: "anime",
  },
] as const;

type ContentType = "movie" | "series" | "anime";

export function SiteHeader({
  active = "home",
}: SiteHeaderProps) {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const searchParams = useSearch({
    strict: false,
  }) as {
    q?: string;
  };

  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(
    searchParams.q ?? "",
  );

  useEffect(() => {
    setSearchQuery(searchParams.q ?? "");

    if (searchParams.q) {
      setSearchOpen(true);
    }
  }, [searchParams.q]);

  const updateSearch = (value: string) => {
    setSearchQuery(value);

    void navigate({
      to: "/",
      search: (previous: Record<string, unknown>) => ({
        ...previous,
        q: value.trim() || undefined,
      }),
    });
  };

  const toggleSearch = () => {
    setSearchOpen((open) => {
      const nextOpen = !open;

      if (!nextOpen && !searchQuery.trim()) {
        setSearchQuery("");

        void navigate({
          to: "/",
          search: (previous: Record<string, unknown>) => ({
            ...previous,
            q: undefined,
          }),
        });
      }

      return nextOpen;
    });
  };

  const navigateToCatalog = (type?: ContentType) => {
    setMenuOpen(false);
    setMobileOpen(false);

    void navigate({
      to: "/",
      search: type ? { type } : {},
    });
  };

  const handleLogout = async () => {
    setMenuOpen(false);

    const { error } = await supabase.auth.signOut();

    if (error) {
      toast.error("Could not sign out");
      return;
    }

    toast.success("Signed out");

    void navigate({
      to: "/",
    });
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto max-w-[1500px] px-3 pt-1 sm:px-5">
        <div className="relative bg-transparent transition-all duration-300">


          <div className="flex h-16 items-center justify-between px-3 sm:px-5">
            {/* Logo */}
            <button
              type="button"
              onClick={() => navigateToCatalog()}
              className="
                group
                flex
                shrink-0
                items-center
                gap-2
                text-left
              "
              aria-label="Go to TryBox home"
            >
              <span
                className="
                  flex
                  size-8
                  items-center
                  justify-center
                  rounded-lg
                  bg-primary
                  text-sm
                  font-black
                  text-primary-foreground
                  shadow-lg
                  shadow-primary/30
                  transition
                  duration-300
                  group-hover:rotate-3
                  group-hover:scale-105
                "
              >
                T
              </span>

              <span
                className="
                  hidden
                  text-lg
                  font-black
                  tracking-[-0.06em]
                  text-white
                  transition
                  duration-300
                  group-hover:text-primary
                  sm:block
                "
              >
                TRYBOX
              </span>
            </button>

            {/* Desktop navigation */}
            <nav
              aria-label="Main navigation"
              className="
                absolute
                left-1/2
                hidden
                -translate-x-1/2
                items-center
                gap-0.5
                rounded-full
                border
                border-white/15
                bg-white/[0.05]
                p-0.5
                shadow-lg
                backdrop-blur-xl
                md:flex
              "

            >
              {NAV_LINKS.map((link) => {
                const isActive = active === link.id;

                return (
                  <button
                    key={link.id}
                    type="button"
                    onClick={() =>
                      navigateToCatalog(link.type)
                    }
                    className={`
                      relative
                      rounded-full

                      px-4
                      py-2
                      text-xs
                      font-semibold
                      transition-all
                      duration-300
                      ${
                        isActive
                          ? "bg-white text-black shadow-lg shadow-white/10"
                          : "text-white/55 hover:bg-white/10 hover:text-white"
                      }
                    `}
                  >
                    {link.label}

                    {isActive && (
                      <span
                        className="
                          absolute
                          -bottom-1
                          left-1/2
                          h-0.5
                          w-5
                          -translate-x-1/2
                          rounded-full
                          bg-primary
                          shadow-[0_0_10px_hsl(var(--primary))]
                        "
                      />
                    )}
                  </button>
                );
              })}

              {/* Desktop search */}
              <div
                className={`
                  flex
                  items-center
                  overflow-hidden
                  rounded-full
                  border
                  border-white/15
                  bg-white/5
                  transition-all
                  duration-300
                  ${
                    searchOpen
                      ? "ml-1 w-52 bg-black/60 ring-1 ring-white/15"
                      : "w-10"
                  }

                `}
              >
                <button
                  type="button"
                  onClick={toggleSearch}
                  aria-label={
                    searchOpen
                      ? "Close search"
                      : "Open search"
                  }
                  aria-expanded={searchOpen}
                  className="
                    flex
                    size-10
                    shrink-0
                    items-center
                    justify-center
                    text-white/60
                    transition
                    hover:text-white
                  "
                >
                  {searchOpen ? (
                    <X className="size-4" />
                  ) : (
                    <Search className="size-4" />
                  )}
                </button>

                {searchOpen && (
                  <input
                    autoFocus
                    style={{ boxShadow: 'none', border: 'none', outline: 'none' }}
                    value={searchQuery}
                    onChange={(event) =>
                      updateSearch(event.target.value)
                    }
                    placeholder="Search catalog..."
                    aria-label="Search catalog"
                    className="
                      min-w-0
                      flex-1
                      bg-transparent
                      py-2
                      pr-3
                      text-xs
                      text-white
                      border-none focus:border-none focus:ring-0 focus:ring-offset-0 shadow-none
                      placeholder:text-white/35
                    "
                  />
                )}
              </div>
            </nav>

            {/* Right-side actions */}
            <div className="flex items-center gap-1.5">
              {isAdmin && (
                <div className="hidden items-center gap-2 lg:flex">
                  <Link
                    to="/admin"
                    className="
                      group
                      flex
                      items-center
                      gap-1.5
                      rounded-lg
                      border
                      border-amber-400/25
                      bg-amber-400/10
                      px-3
                      py-2
                      text-xs
                      font-semibold
                      text-amber-300
                      transition
                      duration-300
                      hover:border-amber-400/50
                      hover:bg-amber-400/20
                    "
                  >
                    <FileEdit className="size-3.5 transition group-hover:rotate-[-8deg]" />
                    Edit Catalog
                  </Link>

                  <Link
                    to="/admin"
                    search={{ action: "new" }}
                    className="
                      flex
                      items-center
                      gap-1.5
                      rounded-lg
                      bg-amber-400
                      px-3
                      py-2
                      text-xs
                      font-bold
                      text-black
                      shadow-lg
                      shadow-amber-400/10
                      transition
                      duration-300
                      hover:bg-amber-300
                      hover:shadow-amber-400/25
                    "
                  >
                    <Plus className="size-3.5" />
                    Add Title
                  </Link>
                </div>
              )}

              {/* Mobile search */}
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  toggleSearch();
                }}
                aria-label="Search"
                aria-expanded={searchOpen}
                className="
                  rounded-lg
                  p-2.5
                  text-white/60
                  transition
                  hover:bg-white/10
                  hover:text-white
                  md:hidden
                "
              >
                {searchOpen ? (
                  <X className="size-4" />
                ) : (
                  <Search className="size-4" />
                )}
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setMenuOpen((open) => !open)
                  }
                  aria-label="User menu"
                  aria-expanded={menuOpen}
                  className="
                    flex
                    size-9
                    items-center
                    justify-center
                    rounded-lg
                    border
                    border-white/10
                    bg-white/[0.06]
                    text-white
                    transition
                    duration-300
                    hover:border-white/20
                    hover:bg-white/10
                  "
                >
                  <UserRound className="size-4" />
                </button>

                {menuOpen && (
                  <>
                    <button
                      type="button"
                      aria-label="Close user menu"
                      className="fixed inset-0 z-[-1] cursor-default"
                      onClick={() => setMenuOpen(false)}
                    />

                    <div
                      className="
                        absolute
                        right-0
                        mt-3
                        w-60
                        origin-top-right
                        animate-in
                        fade-in
                        zoom-in-95
                        slide-in-from-top-2
                        overflow-hidden
                        rounded-2xl
                        border
                        border-white/10
                        bg-zinc-950/95
                        p-1.5
                        shadow-2xl
                        shadow-black/40
                        backdrop-blur-2xl
                      "
                    >
                      {user && (
                        <div className="mb-1 border-b border-white/10 px-3 py-3">
                          <p className="truncate text-xs font-semibold text-white">
                            {user.email}
                          </p>
                          <p className="mt-1 text-[10px] text-white/45">
                            {isAdmin ? "Administrator" : "Member"}
                          </p>
                        </div>
                      )}

                      {!user ? (
                        <>
                          <Link
                            to="/auth"
                            onClick={() => setMenuOpen(false)}
                            className="
                              flex
                              items-center
                              gap-3
                              rounded-xl
                              px-3
                              py-2.5
                              text-xs
                              font-medium
                              text-white/80
                              transition
                              hover:bg-white/10
                              hover:text-white
                            "
                          >
                            <LogIn className="size-4 text-primary" />
                            User Login
                            <ChevronRight className="ml-auto size-3.5 opacity-40" />
                          </Link>

                          <Link
                            to="/admin"
                            onClick={() => setMenuOpen(false)}
                            className="
                              flex
                              items-center
                              gap-3
                              rounded-xl
                              px-3
                              py-2.5
                              text-xs
                              font-medium
                              text-white/80
                              transition
                              hover:bg-white/10
                              hover:text-white
                            "
                          >
                            <Shield className="size-4 text-amber-400" />
                            Admin Login
                            <ChevronRight className="ml-auto size-3.5 opacity-40" />
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link
                            to="/my-box"
                            onClick={() => setMenuOpen(false)}
                            className="
                              flex
                              items-center
                              gap-3
                              rounded-xl
                              px-3
                              py-2.5
                              text-xs
                              font-medium
                              text-white/80
                              transition
                              hover:bg-white/10
                              hover:text-white
                            "
                          >
                            <Bookmark className="size-4 text-primary" />
                            My Box
                            <ChevronRight className="ml-auto size-3.5 opacity-40" />
                          </Link>

                          {isAdmin && (
                            <Link
                              to="/admin"
                              onClick={() => setMenuOpen(false)}
                              className="
                                flex
                                items-center
                                gap-3
                                rounded-xl
                                px-3
                                py-2.5
                                text-xs
                                font-medium
                                text-white/80
                                transition
                                hover:bg-white/10
                                hover:text-white
                              "
                            >
                              <Shield className="size-4 text-amber-400" />
                              Admin Console
                              <ChevronRight className="ml-auto size-3.5 opacity-40" />
                            </Link>
                          )}

                          <div className="my-1 border-t border-white/10" />

                          <button
                            type="button"
                            onClick={() => void handleLogout()}
                            className="
                              flex
                              w-full
                              items-center
                              gap-3
                              rounded-xl
                              px-3
                              py-2.5
                              text-xs
                              font-medium
                              text-red-400
                              transition
                              hover:bg-red-500/10
                            "
                          >
                            <LogOut className="size-4" />
                            Logout
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Mobile menu button */}
              <button
                type="button"
                onClick={() =>
                  setMobileOpen((open) => !open)
                }
                aria-label="Toggle mobile menu"
                aria-expanded={mobileOpen}
                className="
                  rounded-lg
                  p-2.5
                  text-white/60
                  transition
                  hover:bg-white/10
                  hover:text-white
                  md:hidden
                "
              >
                {mobileOpen ? (
                  <X className="size-4" />
                ) : (
                  <Menu className="size-4" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile search input */}
          {searchOpen && (
            <div className="border-t border-white/10 p-3 md:hidden">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3">
                <Search className="size-4 shrink-0 text-white/40" />
                <input
                  autoFocus
                  style={{ boxShadow: 'none', border: 'none', outline: 'none' }}
                  value={searchQuery}
                  onChange={(event) =>
                    updateSearch(event.target.value)
                  }
                  placeholder="Search movies, series, anime..."
                  aria-label="Search catalog"
                  className="
                    min-w-0
                    flex-1
                    bg-transparent
                    py-3
                    text-sm
                    text-white
                 border-none focus:border-none focus:ring-0 focus:ring-offset-0 shadow-none 
                    placeholder:text-white/35
                  "
                />
              </div>
            </div>
          )}

          {/* Mobile navigation */}
          {mobileOpen && (
            <div
              className="
                border-t
                border-white/10
                p-3
                md:hidden
              "
            >
              <nav className="grid gap-1">
                {NAV_LINKS.map((link) => (
                  <button
                    key={link.id}
                    type="button"
                    onClick={() =>
                      navigateToCatalog(link.type)
                    }
                    className={`
                      flex
                      items-center
                      rounded-xl
                      px-3
                      py-3
                      text-left
                      text-sm
                      font-semibold
                      transition
                      ${
                        active === link.id
                          ? "bg-white text-black"
                          : "text-white/75 hover:bg-white/10 hover:text-white"
                      }
                    `}
                  >
                    {link.label}

                    {active === link.id && (
                      <span className="ml-auto size-1.5 rounded-full bg-primary" />
                    )}
                  </button>
                ))}

                {isAdmin && (
                  <>
                    <div className="my-2 border-t border-white/10" />

                    <Link
                      to="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="
                        flex
                        items-center
                        gap-3
                        rounded-xl
                        px-3
                        py-3
                        text-sm
                        font-semibold
                        text-amber-300
                        transition
                        hover:bg-amber-400/10
                      "
                    >
                      <FileEdit className="size-4" />
                      Edit Catalog
                    </Link>

                    <Link
                      to="/admin"
                      search={{ action: "new" }}
                      onClick={() => setMobileOpen(false)}
                      className="
                        flex
                        items-center
                        gap-3
                        rounded-xl
                        bg-amber-400
                        px-3
                        py-3
                        text-sm
                        font-bold
                        text-black
                        transition
                        hover:bg-amber-300
                      "
                    >
                      <Plus className="size-4" />
                      Add New Title
                    </Link>
                  </>
                )}
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default SiteHeader;
