import { statusLabel } from "@/config/customerStatus";

// Horizontal bars: status names are long, so a column chart would need rotated
// labels. Sequential single hue (magnitude, not identity) with the bar width as
// the only encoding; the count rides the bar end as a direct label.
export function PipelineBarChart({ data, total }) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <ul className="space-y-2.5">
      {data.map((d) => {
        const pct = total ? Math.round((d.value / total) * 100) : 0;
        return (
          <li key={d.status} className="flex items-center gap-3">
            <span
              className="w-40 shrink-0 truncate text-xs font-medium text-muted-foreground"
              title={statusLabel(d.status)}
            >
              {statusLabel(d.status)}
            </span>

            <div className="relative h-5 min-w-0 flex-1 overflow-hidden rounded-md bg-secondary">
              <div
                className="h-full rounded-md bg-brand-600 transition-[width] duration-500"
                style={{ width: d.value ? `${Math.max(2, (d.value / max) * 100)}%` : 0 }}
              />
            </div>

            <span
              className="w-16 shrink-0 text-right text-xs font-semibold text-ink"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {d.value}
              <span className="ml-1 font-normal text-muted-foreground">{pct}%</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
