import type { WeeklyApplicationPoint } from "@/types";

interface Props {
  data: WeeklyApplicationPoint[];
}

export default function WeeklyChart({ data }: Props) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return <p className="px-4 py-6 text-sm text-gray-400">No applications in the last 8 weeks.</p>;
  }

  return (
    <div className="px-4 py-4">
      <div className="flex items-end gap-2 h-32">
        {data.map((d) => {
          const heightPct = (d.count / max) * 100;
          const label = new Date(d.week_start).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          });
          return (
            <div key={d.week_start} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col justify-end h-full">
                <div
                  className="bg-brand-500 hover:bg-brand-600 rounded-t transition-colors min-h-[2px]"
                  style={{ height: `${heightPct}%` }}
                  title={`${d.count} applications week of ${label}`}
                />
              </div>
              <span className="text-[10px] text-gray-400 tabular-nums">{d.count}</span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-gray-400">
        <span>
          {new Date(data[0].week_start).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </span>
        <span>
          {new Date(data[data.length - 1].week_start).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        {total} applications in the last 8 weeks
      </p>
    </div>
  );
}
