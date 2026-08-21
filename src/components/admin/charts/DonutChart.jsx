// Part-to-whole donut with a center figure. Segments are stroked arcs on one
// circle (stroke-dasharray), which keeps the 2px surface gap between neighbours
// honest without path math. `segments` = [{ label, value, color }].
const SIZE = 160;
const STROKE = 22;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;
const GAP = 2; // surface gap, in path units

export function DonutChart({ segments, centerValue, centerLabel }) {
  const total = segments.reduce((s, x) => s + x.value, 0);

  let offset = 0;
  const arcs = segments
    .filter((s) => s.value > 0)
    .map((s) => {
      const frac = s.value / total;
      const len = Math.max(0, frac * C - GAP);
      const arc = { ...s, len, offset, pct: Math.round(frac * 100) };
      offset += frac * C;
      return arc;
    });

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative shrink-0">
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="img"
          aria-label={`${centerLabel}: ${centerValue}`}
        >
          {/* Track — a lighter step behind the segments so an empty ring still reads. */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={STROKE}
          />
          {/* -90deg so the first segment starts at 12 o'clock. */}
          <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
            {arcs.map((a) => (
              <circle
                key={a.label}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={R}
                fill="none"
                stroke={a.color}
                strokeWidth={STROKE}
                strokeDasharray={`${a.len} ${C - a.len}`}
                strokeDashoffset={-a.offset}
                strokeLinecap="butt"
              />
            ))}
          </g>
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold leading-none text-ink">{centerValue}</span>
          <span className="mt-1 text-[11px] font-medium text-muted-foreground">
            {centerLabel}
          </span>
        </div>
      </div>

      {/* Legend is always present for >=2 series — identity is never color-alone. */}
      <ul className="w-full min-w-0 flex-1 space-y-2.5">
        {segments.map((s) => {
          const pct = total ? Math.round((s.value / total) * 100) : 0;
          return (
            <li key={s.label} className="flex items-center gap-2.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                {s.label}
              </span>
              <span
                className="shrink-0 text-xs font-semibold text-ink"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {s.value}
                <span className="ml-1 font-normal text-muted-foreground">{pct}%</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
