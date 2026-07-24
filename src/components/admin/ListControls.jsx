import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Single-select chip row (e.g. notification filter). options: [{key,label}].
export function ChipRow({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={cn(
            "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
            value === o.key
              ? "border-brand-600 bg-brand-50 text-brand-700"
              : "border-border text-muted-foreground hover:bg-secondary"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// Multi-select toggle chips (e.g. actions, entity types). Values are strings.
export function MultiChips({ options, selected, onToggle, emptyLabel = "No options yet" }) {
  if (!options.length) return <span className="text-xs text-muted-foreground">{emptyLabel}</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const val = typeof o === "string" ? o : o.value;
        const label = typeof o === "string" ? o : o.label;
        return (
          <button
            key={val}
            onClick={() => onToggle(val)}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
              selected.includes(val)
                ? "border-brand-600 bg-brand-50 text-brand-700"
                : "border-border text-muted-foreground hover:bg-secondary"
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// Pagination footer + page-size selector. Shared across log pages.
export function PaginationBar({ page, pageCount, pageSize, total, onPage, onPageSize, noun = "rows" }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm">
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground">
          {total} {noun} · page {page + 1} of {pageCount}
        </span>
        <Select value={String(pageSize)} onValueChange={(v) => onPageSize(Number(v))}>
          <SelectTrigger className="h-8 w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[25, 50, 100].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}/page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" disabled={page === 0} onClick={() => onPage(page - 1)}>
          <ArrowLeft className="h-4 w-4" /> Prev
        </Button>
        <Button size="sm" variant="secondary" disabled={page + 1 >= pageCount} onClick={() => onPage(page + 1)}>
          Next <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
