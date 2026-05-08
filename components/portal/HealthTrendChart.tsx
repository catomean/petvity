"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceArea,
  CartesianGrid,
} from "recharts";

export type ChartDataPoint = Record<string, number | string | null>;

type Props = {
  data: ChartDataPoint[];
  lines: { dataKey: string; name: string; color: string }[];
  unit: string;
  title: string;
  normalMin?: number;
  normalMax?: number;
  /** 1–5 scale: show integer ticks only */
  integerScale?: boolean;
  noDataText?: string;
  normalRangeLabel?: string;
};

export function HealthTrendChart({
  data,
  lines,
  unit,
  title,
  normalMin,
  normalMax,
  integerScale,
  noDataText = "No data yet",
  normalRangeLabel = "Normal range",
}: Props) {
  const hasData = data.some((d) =>
    lines.some((l) => d[l.dataKey] != null),
  );

  if (!hasData) {
    return (
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-[var(--ink)] mb-3">{title}</h3>
        <div className="h-32 flex items-center justify-center text-sm text-[var(--faint)]">
          {noDataText}
        </div>
      </div>
    );
  }

  const showRange = normalMin != null && normalMax != null;
  const showLegend = lines.length > 1 || showRange;

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-[var(--ink)] mb-1">{title}</h3>
      {showLegend && (
        <div className="flex flex-wrap items-center gap-3 mb-3">
          {lines.length > 1 && lines.map((l) => (
            <span key={l.dataKey} className="flex items-center gap-1.5 text-xs text-[var(--ink2)]">
              <span className="inline-block w-3 h-0.5 rounded" style={{ backgroundColor: l.color }} />
              {l.name}
            </span>
          ))}
          {showRange && (
            <span className="flex items-center gap-1.5 text-xs text-[var(--ink2)]">
              <span className="inline-block w-3 h-2 rounded-sm" style={{ background: "color-mix(in srgb, var(--green) 25%, transparent)" }} />
              {normalRangeLabel}
            </span>
          )}
        </div>
      )}
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "var(--muted)" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--muted)" }}
            tickLine={false}
            axisLine={false}
            domain={integerScale ? [1, 5] : ["auto", "auto"]}
            ticks={integerScale ? [1, 2, 3, 4, 5] : undefined}
            unit={unit === "/5" ? "" : unit}
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid var(--border)",
              boxShadow: "var(--tooltip-shadow)",
            }}
            formatter={(value) => (value != null ? [`${value}${unit}`, undefined] : [undefined, undefined])}
          />
          {normalMin != null && normalMax != null && (
            <ReferenceArea
              y1={normalMin}
              y2={normalMax}
              fill="var(--green)"
              fillOpacity={0.08}
              stroke="var(--green)"
              strokeOpacity={0.25}
              strokeDasharray="4 2"
            />
          )}
          {lines.map((l) => (
            <Line
              key={l.dataKey}
              type="monotone"
              dataKey={l.dataKey}
              name={l.name}
              stroke={l.color}
              strokeWidth={2}
              dot={{ r: 3, fill: l.color, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
