import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listJobs, downloadJobsCsv } from "@/api/jobs";
import { daysSince, relativeDays } from "@/utils/date";
import { useToast } from "@/context/ToastContext";
import type { JobListItem, JobStatus } from "@/types";

const ALL_STATUSES: JobStatus[] = [
  "wishlist", "applied", "phone_screen", "interview", "offer", "rejected", "withdrawn", "accepted",
];

const SORT_OPTIONS = [
  { value: "-created_at", label: "Newest first" },
  { value: "created_at", label: "Oldest first" },
  { value: "-date_applied", label: "Recently applied" },
  { value: "deadline", label: "Deadline (soonest)" },
  { value: "company", label: "Company A–Z" },
  { value: "status", label: "Status" },
];

export default function Jobs() {
  const { notify } = useToast();
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [ordering, setOrdering] = useState("-created_at");
  const [showArchived, setShowArchived] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      await downloadJobsCsv();
      notify("CSV exported");
    } catch {
      notify("Export failed", "error");
    } finally {
      setExporting(false);
    }
  }

  function fetchJobs() {
    setLoading(true);
    listJobs({
      search: search || undefined,
      status: statusFilter || undefined,
      ordering,
      archived: showArchived || undefined,
    })
      .then((res) => setJobs(res.results))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchJobs();
  }, [search, statusFilter, ordering, showArchived]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={exporting || jobs.length === 0}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium disabled:opacity-50"
          >
            {exporting ? "Exporting..." : "Export CSV"}
          </button>
          <Link
            to="/jobs/new"
            className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            + Add job
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search company or title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
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
        <select
          value={ordering}
          onChange={(e) => setOrdering(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          Show archived
        </label>
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
                    Applied {relativeDays(daysSince(job.date_applied) ?? 0)}
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
