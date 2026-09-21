import { Link } from "@tanstack/react-router";
import type { CategoryRow } from "@/lib/pricing";

/** Horizontal room filter strip. The parent owns what a tap means. */
export function CategoryChips({
  categories,
  active,
  onSelect,
  includeAll = true,
}: {
  categories: CategoryRow[];
  active: string;
  onSelect: (categoryId: string) => void;
  includeAll?: boolean;
}) {
  const chips = [
    ...(includeAll ? [{ id: "all", name: "Everything" }] : []),
    ...categories.map((category) => ({ id: category.id, name: category.name })),
  ];

  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
      {chips.map((chip) => {
        const isActive = chip.id === active;
        return (
          <button
            key={chip.id}
            type="button"
            onClick={() => onSelect(chip.id)}
            aria-pressed={isActive}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
              isActive
                ? "border-transparent bg-walnut text-walnut-foreground"
                : "border-border bg-surface text-ink-soft hover:border-walnut/40 hover:text-foreground"
            }`}
          >
            {chip.name}
          </button>
        );
      })}
    </div>
  );
}

/** Section label used above the home screen blocks. */
export function SectionHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: { label: string; to: "/catalog" | "/offers"; search?: Record<string, string> };
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-brass">
          {eyebrow}
        </p>
        <h2 className="mt-1 font-display text-[19px] leading-tight text-foreground">
          {title}
        </h2>
      </div>
      {action && (
        <Link
          to={action.to}
          search={action.search as never}
          className="shrink-0 pb-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-primary hover:text-primary/80"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
