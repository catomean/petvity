"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
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
}: Props) {
  const hasData = data.some((d) =>
    lines.some((l) => d[l.dataKey] != null),
  );

  if (!hasData) {
    return (
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-[var(--ink)] mb-3">{title}</h3>
        <div className="h-32 flex items-center justify-center text-sm text-[var(--faint)]">
          No data yet
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-[var(--ink)] mb-1">{title}</h3>
      {lines.length > 1 && (
        <div className="flex flex-wrap gap-3 mb-3">
          {lines.map((l) => (
            <span key={l.dataKey} className="flex items-center gap-1.5 text-xs text-[var(--ink2)]">
              <span className="inline-block w-3 h-0.5 rounded" style={{ backgroundColor: l.color }} />
              {l.name}
            </span>
          ))}
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
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
            formatter={(value) => (value != null ? [`${value}${unit}`, undefined] : [undefined, undefined])}
          />
          {normalMin != null && (
            <ReferenceLine
              y={normalMin}
              stroke="var(--green)"
              strokeDasharray="4 2"
              strokeOpacity={0.5}
            />
          )}
          {normalMax != null && (
            <ReferenceLine
              y={normalMax}
              stroke="var(--green)"
              strokeDasharray="4 2"
              strokeOpacity={0.5}
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
