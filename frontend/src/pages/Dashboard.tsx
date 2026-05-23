import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listJobs } from "@/api/jobs";
import type { JobListItem, JobStatus } from "@/types";

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

export default function Dashboard() {
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listJobs({ ordering: "-created_at" })
      .then((res) => setJobs(res.results))
      .finally(() => setLoading(false));
  }, []);

  const byStatus = jobs.reduce<Partial<Record<JobStatus, number>>>((acc, job) => {
    acc[job.status] = (acc[job.status] ?? 0) + 1;
    return acc;
  }, {});

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(["applied", "interview", "offer", "rejected"] as JobStatus[]).map((s) => (
          <div key={s} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500 capitalize">{s.replace("_", " ")}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{byStatus[s] ?? 0}</p>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent applications</h2>
          <Link to="/jobs" className="text-sm text-brand-600 hover:underline font-medium">
            View all
          </Link>
        </div>
        {jobs.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No jobs yet.{" "}
            <Link to="/jobs" className="text-brand-600 hover:underline">
              Add your first one.
            </Link>
          </p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {jobs.slice(0, 5).map((job) => (
              <Link
                key={job.id}
                to={`/jobs/${job.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium text-gray-900">{job.title}</p>
                  <p className="text-sm text-gray-500">{job.company}</p>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[job.status]}`}
                >
                  {job.status.replace("_", " ")}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
