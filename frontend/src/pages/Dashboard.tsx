import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboard } from "@/api/jobs";
import { daysSince, relativeDays } from "@/utils/date";
import StatusBreakdown from "@/components/StatusBreakdown";
import WeeklyChart from "@/components/WeeklyChart";
import type { DashboardData, JobStatus } from "@/types";

const STATUS_COLORS: Record<JobStatus, string> = {
  wishlist: "bg-gray-100 text-gray-700",
  applied: "bg-blue-100 text-blue-700",
  phone_screen: "bg-yellow-100 text-yellow-700",
  interview: "bg-purple-100 text-purple-700",
  offer: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  withdrawn: "bg-gray-100 text-gray-500",
  accepted: "bg-emerald-100 text-emerald-700",
};

const SUMMARY_STATUSES: JobStatus[] = ["applied", "interview", "offer", "rejected"];

const INTERVIEW_TYPE_LABEL: Record<string, string> = {
  phone: "Phone Screen",
  technical: "Technical",
  behavioral: "Behavioral",
  onsite: "On-site",
  panel: "Panel",
  other: "Other",
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (!data) return <p className="text-gray-500">No data.</p>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {SUMMARY_STATUSES.map((s) => (
          <div key={s} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500 capitalize">{s.replace("_", " ")}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {data.status_counts[s] ?? 0}
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Panel title="Status breakdown" emptyText="No applications yet.">
          <StatusBreakdown counts={data.status_counts} />
        </Panel>
        <Panel title="Applications over time" emptyText="No applications yet.">
          <WeeklyChart data={data.weekly_applications} />
        </Panel>
      </div>

      {/* Upcoming interviews + deadlines side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Panel title="Upcoming interviews" emptyText="No interviews scheduled.">
          {data.upcoming_interviews.length > 0 && (
            <div className="divide-y divide-gray-100">
              {data.upcoming_interviews.map((iv) => (
                <div key={iv.id} className="px-4 py-3">
                  <p className="font-medium text-gray-900 text-sm capitalize">
                    {INTERVIEW_TYPE_LABEL[iv.interview_type] ?? iv.interview_type}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(iv.scheduled_at).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                  {iv.location && <p className="text-xs text-gray-400 mt-0.5">{iv.location}</p>}
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Approaching deadlines" emptyText="No upcoming deadlines.">
          {data.approaching_deadlines.length > 0 && (
            <div className="divide-y divide-gray-100">
              {data.approaching_deadlines.map((job) => {
                const daysLeft = job.deadline
                  ? Math.ceil(
                      (new Date(job.deadline).getTime() - Date.now()) /
                        (1000 * 60 * 60 * 24)
                    )
                  : null;
                return (
                  <Link
                    key={job.id}
                    to={`/jobs/${job.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{job.title}</p>
                      <p className="text-xs text-gray-500 truncate">{job.company}</p>
                    </div>
                    <span
                      className={`text-xs font-medium shrink-0 ml-3 ${
                        (daysLeft ?? 99) <= 2 ? "text-red-600" : "text-gray-500"
                      }`}
                    >
                      {daysLeft === 0 ? "Today" : daysLeft === 1 ? "Tomorrow" : `${daysLeft}d`}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </Panel>
      </div>

      {/* Recent applications */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent applications</h2>
          <Link to="/jobs" className="text-sm text-brand-600 hover:underline font-medium">
            View all
          </Link>
        </div>
        {data.recent_jobs.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No jobs yet.{" "}
            <Link to="/jobs/new" className="text-brand-600 hover:underline">
              Add your first one.
            </Link>
          </p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {data.recent_jobs.map((job) => (
              <Link
                key={job.id}
                to={`/jobs/${job.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium text-gray-900">{job.title}</p>
                  <p className="text-sm text-gray-500">{job.company}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[job.status]}`}
                  >
                    {job.status.replace("_", " ")}
                  </span>
                  {job.date_applied && (
                    <p className="text-xs text-gray-400 mt-1">
                      Applied {relativeDays(daysSince(job.date_applied) ?? 0)}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Panel({
  title,
  emptyText,
  children,
}: {
  title: string;
  emptyText: string;
  children: React.ReactNode;
}) {
  const isEmpty = !children || (Array.isArray(children) && children.length === 0);
  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <h2 className="text-sm font-semibold text-gray-900 px-4 py-3 border-b border-gray-100">
        {title}
      </h2>
      {isEmpty ? <p className="px-4 py-6 text-sm text-gray-400">{emptyText}</p> : children}
    </div>
  );
}
