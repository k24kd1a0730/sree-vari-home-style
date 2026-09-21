import { Link, useLocation } from "@tanstack/react-router";
import { Home, KeyRound, LayoutGrid, Search, Tag } from "lucide-react";
import type { ReactNode } from "react";

const CATALOG_SEARCH = { q: "", cat: "all", offer: "all" };

/**
 * Phone-first shell: a single centered column on desktop, full bleed on a
 * phone, with the tab bar pinned to the bottom of that column.
 */
export function AppShell({
  children,
  active,
}: {
  children: ReactNode;
  active: "home" | "catalog" | "offers" | "owner";
}) {
  const { pathname } = useLocation();
  const onProduct = pathname.startsWith("/product/");

  const tabClass = (isActive: boolean) =>
    `flex flex-col items-center gap-1 rounded-xl px-2 py-2 transition-colors ${
      isActive ? "text-primary" : "text-ink-soft hover:text-foreground"
    }`;
  const tabLabel = "font-mono text-[9px] uppercase tracking-[0.14em]";

  return (
    <div className="min-h-screen bg-sand-deep/50 sm:py-6">
      <div className="relative mx-auto flex min-h-screen w-full max-w-[420px] flex-col bg-background shadow-[0_0_0_1px_var(--color-border),0_24px_60px_-24px_color-mix(in_oklab,var(--color-walnut)_35%,transparent)] sm:min-h-[calc(100vh-3rem)] sm:overflow-hidden sm:rounded-3xl">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border/70 bg-background/95 px-4 py-3 backdrop-blur">
          <Link to="/" className="flex items-baseline gap-2">
            <span className="font-display text-[20px] font-semibold leading-none tracking-tight text-foreground">
              Sree Vari
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-brass">
              Furnitures
            </span>
          </Link>
          <div className="flex items-center gap-1.5">
            <Link
              to="/catalog"
              search={CATALOG_SEARCH}
              aria-label="Search the catalogue"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border/80 text-foreground transition-colors hover:bg-accent"
            >
              <Search className="h-4 w-4" />
            </Link>
            <Link
              to="/owner"
              aria-label="Owner area"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border/80 text-foreground transition-colors hover:bg-accent"
            >
              <KeyRound className="h-4 w-4" />
            </Link>
          </div>
        </header>

        <main className="flex-1 pb-24">{children}</main>

        <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-[420px] -translate-x-1/2 border-t border-border/70 bg-background/95 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur">
          <ul className="flex items-stretch justify-around">
            <li className="flex-1">
              <Link to="/" className={tabClass(active === "home")}>
                <Home className="h-[18px] w-[18px]" />
                <span className={tabLabel}>Showroom</span>
              </Link>
            </li>
            <li className="flex-1">
              <Link
                to="/catalog"
                search={CATALOG_SEARCH}
                className={tabClass(active === "catalog" || onProduct)}
              >
                <LayoutGrid className="h-[18px] w-[18px]" />
                <span className={tabLabel}>Catalogue</span>
              </Link>
            </li>
            <li className="flex-1">
              <Link to="/offers" className={tabClass(active === "offers")}>
                <Tag className="h-[18px] w-[18px]" />
                <span className={tabLabel}>Offers</span>
              </Link>
            </li>
            <li className="flex-1">
              <Link to="/owner" className={tabClass(active === "owner")}>
                <KeyRound className="h-[18px] w-[18px]" />
                <span className={tabLabel}>Owner</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
