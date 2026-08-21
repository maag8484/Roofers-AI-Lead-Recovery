import { useMemo, useState } from "react";

// Single-series area+line chart drawn as inline SVG. No charting dependency —
// the bundle is already ~1.3MB and this needs one line, one wash, and a hover
// crosshair. viewBox + preserveAspectRatio="none" would distort strokes, so the
// chart renders at a fixed internal size and scales via CSS width:100%.
const W = 720;
const H = 200;
const PAD = { top: 14, right: 14, bottom: 26, left: 34 };

const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

// Round the axis max up to a clean number so ticks read 0 / 2 / 4, not 0 / 3.7.
// Counts are integers, so the max must also land on an EVEN number — the chart
// draws a midpoint tick, and an odd max would label it "2.5 signups".
function niceMax(max) {
  if (max <= 4) return 4;
  const pow = Math.pow(10, Math.floor(Math.log10(max)));
  for (const mult of [1, 2, 2.5, 5, 10]) {
    const step = pow * mult;
    const candidate = Math.ceil(max / step) * step;
    if (Number.isInteger(candidate / 2)) return candidate;
  }
  return Math.ceil(max / 2) * 2;
}

export function TrendAreaChart({ data, color = "#2563eb", valueLabel = "signups" }) {
  const [hover, setHover] = useState(null);

  const { points, linePath, areaPath, ticks, peak } = useMemo(() => {
    const values = data.map((d) => d.value);
    const m = niceMax(Math.max(1, ...values));

    const x = (i) => (data.length <= 1 ? 0 : (i / (data.length - 1)) * PLOT_W);
    const y = (v) => PLOT_H - (v / m) * PLOT_H;

    const pts = data.map((d, i) => ({ ...d, x: x(i), y: y(d.value) }));
    const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
    const area = pts.length
      ? `${line} L${pts[pts.length - 1].x},${PLOT_H} L${pts[0].x},${PLOT_H} Z`
      : "";

    // Peak gets a direct label so the chart's headline value is readable
    // without hovering — a tooltip must enhance, never gate.
    let peak = -1;
    pts.forEach((p, i) => {
      if (p.value > 0 && (peak < 0 || p.value > pts[peak].value)) peak = i;
    });

    return {
      points: pts,
      linePath: line,
      areaPath: area,
      peak,
      ticks: [0, m / 2, m].map((v) => ({ v, y: y(v) })),
    };
  }, [data]);

  if (!data.length) return null;

  const gradId = "trend-fill";
  // Nearest-point lookup from the pointer's x within the plot area.
  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = ((e.clientX - rect.left) / rect.width) * W - PAD.left;
    const step = data.length <= 1 ? 1 : PLOT_W / (data.length - 1);
    const i = Math.max(0, Math.min(data.length - 1, Math.round(rel / step)));
    setHover(i);
  };

  const hp = hover != null ? points[hover] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: "auto" }}
        role="img"
        aria-label={`Daily ${valueLabel} over the last ${data.length} days`}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          {/* Area wash: the series hue fading out, never a saturated block. */}
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
        </defs>

        <g transform={`translate(${PAD.left},${PAD.top})`}>
          {/* Recessive hairline gridlines + clean y ticks. */}
          {ticks.map((t) => (
            <g key={t.v}>
              <line x1={0} y1={t.y} x2={PLOT_W} y2={t.y} stroke="#e5e7eb" strokeWidth="1" />
              <text
                x={-8}
                y={t.y + 3.5}
                textAnchor="end"
                className="fill-muted-foreground"
                style={{ fontSize: 10, fontVariantNumeric: "tabular-nums" }}
              >
                {t.v}
              </text>
            </g>
          ))}

          <path d={areaPath} fill={`url(#${gradId})`} />
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Peak marker + direct label. Suppressed while hovered so the
              crosshair readout doesn't collide with the static label. */}
          {peak >= 0 && hover !== peak && (
            <g>
              <circle
                cx={points[peak].x}
                cy={points[peak].y}
                r="4"
                fill={color}
                stroke="#ffffff"
                strokeWidth="2"
              />
              <text
                x={Math.min(PLOT_W - 10, Math.max(10, points[peak].x))}
                y={Math.max(9, points[peak].y - 10)}
                textAnchor="middle"
                className="fill-ink"
                style={{ fontSize: 10, fontWeight: 700 }}
              >
                {points[peak].value}
              </text>
            </g>
          )}

          {/* Crosshair + focused point, with a surface ring so it stays legible. */}
          {hp && (
            <g>
              <line x1={hp.x} y1={0} x2={hp.x} y2={PLOT_H} stroke={color} strokeWidth="1" strokeOpacity="0.35" />
              <circle cx={hp.x} cy={hp.y} r="5" fill={color} stroke="#ffffff" strokeWidth="2" />
            </g>
          )}

          {/* First / last date labels only — a tick per day would be unreadable. */}
          <text x={0} y={PLOT_H + 18} className="fill-muted-foreground" style={{ fontSize: 10 }}>
            {data[0].date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </text>
          <text
            x={PLOT_W}
            y={PLOT_H + 18}
            textAnchor="end"
            className="fill-muted-foreground"
            style={{ fontSize: 10 }}
          >
            {data[data.length - 1].date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </text>
        </g>
      </svg>

      {/* Tooltip in HTML (not SVG) so it inherits type styles and never clips.
          Clamped to 6%..94% so the first/last point's tooltip stays on-card. */}
      {hp && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-white px-2.5 py-1.5 shadow-md"
          style={{
            left: `${Math.min(94, Math.max(6, ((hp.x + PAD.left) / W) * 100))}%`,
            top: `${((hp.y + PAD.top) / H) * 100}%`,
          }}
        >
          <p className="whitespace-nowrap text-xs font-semibold text-ink">
            {hp.value} {valueLabel}
          </p>
          <p className="whitespace-nowrap text-[11px] text-muted-foreground">
            {hp.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </p>
        </div>
      )}
    </div>
  );
}
