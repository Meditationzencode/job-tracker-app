import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listJobs } from "@/api/jobs";
import type { JobListItem, JobStatus } from "@/types";

const ALL_STATUSES: JobStatus[] = [
  "wishlist", "applied", "phone_screen", "interview", "offer", "rejected", "withdrawn", "accepted",
];

export default function Jobs() {
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  function fetchJobs() {
    setLoading(true);
    listJobs({ search: search || undefined, status: statusFilter || undefined })
      .then((res) => setJobs(res.results))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchJobs();
  }, [search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
        <Link
          to="/jobs/new"
          className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          + Add job
        </Link>
      </div>

      <div className="flex gap-3">
        <input
          type="search"
          placeholder="Search company or title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : jobs.length === 0 ? (
        <p className="text-gray-500 text-sm">No jobs found.</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {jobs.map((job) => (
            <Link
              key={job.id}
              to={`/jobs/${job.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
            >
              <div>
                <p className="font-medium text-gray-900">{job.title}</p>
                <p className="text-sm text-gray-500">
                  {job.company}
                  {job.location ? ` · ${job.location}` : ""}
                  {job.remote ? " · Remote" : ""}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium text-gray-500 capitalize">
                  {job.status.replace("_", " ")}
                </span>
                {job.date_applied && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Applied {new Date(job.date_applied).toLocaleDateString()}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
