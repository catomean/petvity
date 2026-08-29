import type { SignalReasonData } from "@/lib/domain/pet-signal";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TSignal = (key: string, values?: Record<string, any>) => string;

export function translateSignalReason(data: SignalReasonData, tSignal: TSignal): string {
  const parts: string[] = [];

  switch (data.type) {
    case "no_metrics":
      parts.push(tSignal("reasonNoMetrics"));
      if (data.overdueVaccinations > 0)
        parts.push(tSignal("reasonOverdueVaccinations", { count: data.overdueVaccinations }));
      break;
    case "stale":
      parts.push(tSignal("reasonStale", { days: data.days }));
      if (data.overdueVaccinations > 0)
        parts.push(tSignal("reasonOverdueVaccinations", { count: data.overdueVaccinations }));
      break;
    case "out_of_range":
      for (const d of data.details)
        parts.push(
          tSignal("reasonOutOfRange", {
            metric: tSignal(`metric_${d.id}`),
            value: d.formattedValue,
            range: d.formattedRange,
          }),
        );
      if (data.overdueVaccinations > 0)
        parts.push(tSignal("reasonOverdueVaccinations", { count: data.overdueVaccinations }));
      break;
    case "overdue_only":
      parts.push(tSignal("reasonOverdueVaccinations", { count: data.count }));
      break;
    case "healthy":
      break;
  }

  return parts.join(" · ");
}
