import type { JobStatus } from "@/types";

const STATUS_ORDER: JobStatus[] = [
  "wishlist", "applied", "phone_screen", "interview", "offer", "accepted", "rejected", "withdrawn",
];

const STATUS_COLORS: Record<JobStatus, string> = {
  wishlist: "bg-gray-400",
  applied: "bg-blue-500",
  phone_screen: "bg-yellow-500",
  interview: "bg-purple-500",
  offer: "bg-green-500",
  accepted: "bg-emerald-500",
  rejected: "bg-red-500",
  withdrawn: "bg-gray-300",
};

interface Props {
  counts: Partial<Record<JobStatus, number>>;
}

export default function StatusBreakdown({ counts }: Props) {
  const entries = STATUS_ORDER.map((s) => ({
    status: s,
    count: counts[s] ?? 0,
  })).filter((e) => e.count > 0);

  const total = entries.reduce((sum, e) => sum + e.count, 0);
  const max = entries.reduce((m, e) => Math.max(m, e.count), 0);

  if (total === 0) {
    return <p className="px-4 py-6 text-sm text-gray-400">No applications yet.</p>;
  }

  return (
    <div className="px-4 py-3 space-y-2">
      {entries.map((e) => {
        const widthPct = max === 0 ? 0 : (e.count / max) * 100;
        return (
          <div key={e.status}>
            <div className="flex items-center justify-between text-sm mb-0.5">
              <span className="text-gray-700 capitalize">{e.status.replace("_", " ")}</span>
              <span className="text-gray-500 tabular-nums">{e.count}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${STATUS_COLORS[e.status]} rounded-full transition-all`}
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
