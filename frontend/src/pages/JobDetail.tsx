import { useEffect, useState, type FormEvent } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getJob, deleteJob, updateJob, createInterview, updateInterview, deleteInterview } from "@/api/jobs";
import type { Job, JobStatus, InterviewType } from "@/types";

const ALL_STATUSES: JobStatus[] = [
  "wishlist", "applied", "phone_screen", "interview", "offer", "rejected", "withdrawn", "accepted",
];

const INTERVIEW_TYPES: { value: InterviewType; label: string }[] = [
  { value: "phone", label: "Phone Screen" },
  { value: "technical", label: "Technical" },
  { value: "behavioral", label: "Behavioral" },
  { value: "onsite", label: "On-site" },
  { value: "panel", label: "Panel" },
  { value: "other", label: "Other" },
];

type InterviewDraft = {
  interview_type: InterviewType;
  scheduled_at: string;
  location: string;
  notes: string;
};

const EMPTY_DRAFT: InterviewDraft = {
  interview_type: "phone",
  scheduled_at: "",
  location: "",
  notes: "",
};

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<InterviewDraft>(EMPTY_DRAFT);
  const [savingInterview, setSavingInterview] = useState(false);

  async function refresh() {
    if (!id) return;
    setJob(await getJob(Number(id)));
  }

  useEffect(() => {
    if (!id) return;
    getJob(Number(id))
      .then(setJob)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleStatusChange(status: JobStatus) {
    if (!job) return;
    setJob(await updateJob(job.id, { status }));
  }

  async function handleDelete() {
    if (!job || !confirm("Delete this job?")) return;
    await deleteJob(job.id);
    navigate("/jobs");
  }

  async function handleAddInterview(e: FormEvent) {
    e.preventDefault();
    if (!job) return;
    setSavingInterview(true);
    try {
      await createInterview({ ...draft, job: job.id });
      setDraft(EMPTY_DRAFT);
      setShowForm(false);
      await refresh();
    } finally {
      setSavingInterview(false);
    }
  }

  async function handleToggleComplete(interviewId: number, completed: boolean) {
    await updateInterview(interviewId, { completed });
    await refresh();
  }

  async function handleDeleteInterview(interviewId: number) {
    if (!confirm("Remove this interview?")) return;
    await deleteInterview(interviewId);
    await refresh();
  }

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (!job) return <p className="text-gray-500">Job not found.</p>;

  const pending = job.interviews.filter((iv) => !iv.completed);
  const completed = job.interviews.filter((iv) => iv.completed);
  const sorted = [...pending, ...completed];

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
          <p className="text-gray-500 mt-1">
            {job.company}
            {job.location ? ` · ${job.location}` : ""}
            {job.remote ? " · Remote" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to={`/jobs/${job.id}/edit`}
            className="text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Job info card */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={job.status}
            onChange={(e) => handleStatusChange(e.target.value as JobStatus)}
            className={inputCls}
          >
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>

        {job.url && (
          <div>
            <p className="text-sm font-medium text-gray-700">Job posting</p>
            <a
              href={job.url}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-brand-600 hover:underline break-all"
            >
              {job.url}
            </a>
          </div>
        )}

        {(job.salary_min != null || job.salary_max != null) && (
          <div>
            <p className="text-sm font-medium text-gray-700">Salary</p>
            <p className="text-sm text-gray-600">
              {job.salary_min != null ? `$${job.salary_min.toLocaleString()}` : "—"}
              {" – "}
              {job.salary_max != null ? `$${job.salary_max.toLocaleString()}` : "—"}
            </p>
          </div>
        )}

        {(job.date_applied || job.deadline) && (
          <div className="flex gap-6">
            {job.date_applied && (
              <div>
                <p className="text-sm font-medium text-gray-700">Applied</p>
                <p className="text-sm text-gray-600">
                  {new Date(job.date_applied).toLocaleDateString()}
                </p>
              </div>
            )}
            {job.deadline && (
              <div>
                <p className="text-sm font-medium text-gray-700">Deadline</p>
                <p className="text-sm text-gray-600">
                  {new Date(job.deadline).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        )}

        {job.notes && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Notes</p>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{job.notes}</p>
          </div>
        )}
      </div>

      {/* Interviews */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Interviews
            {job.interviews.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                {pending.length} upcoming · {completed.length} done
              </span>
            )}
          </h2>
          <button
            onClick={() => {
              setShowForm((v) => !v);
              setDraft(EMPTY_DRAFT);
            }}
            className="text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            {showForm ? "Cancel" : "+ Add interview"}
          </button>
        </div>

        {/* Inline add form */}
        {showForm && (
          <form
            onSubmit={handleAddInterview}
            className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 mb-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={draft.interview_type}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, interview_type: e.target.value as InterviewType }))
                  }
                  className={inputCls}
                >
                  {INTERVIEW_TYPES.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date & time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={draft.scheduled_at}
                  onChange={(e) => setDraft((d) => ({ ...d, scheduled_at: e.target.value }))}
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location / link
              </label>
              <input
                value={draft.location}
                onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))}
                className={inputCls}
                placeholder="Zoom link, office address..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                rows={2}
                value={draft.notes}
                onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                className={inputCls}
                placeholder="Topics to prepare, questions to ask..."
              />
            </div>

            <button
              type="submit"
              disabled={savingInterview}
              className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-4 py-1.5 rounded-lg text-sm disabled:opacity-50"
            >
              {savingInterview ? "Saving..." : "Add interview"}
            </button>
          </form>
        )}

        {/* Interview list */}
        {job.interviews.length === 0 ? (
          <p className="text-sm text-gray-400">No interviews yet.</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {sorted.map((iv) => (
              <div
                key={iv.id}
                className={`px-4 py-3 flex items-start justify-between gap-4 ${
                  iv.completed ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <input
                    type="checkbox"
                    checked={iv.completed}
                    onChange={(e) => handleToggleComplete(iv.id, e.target.checked)}
                    title={iv.completed ? "Mark incomplete" : "Mark complete"}
                    className="mt-0.5 shrink-0 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                  />
                  <div className="min-w-0">
                    <p
                      className={`font-medium text-gray-900 capitalize ${
                        iv.completed ? "line-through" : ""
                      }`}
                    >
                      {INTERVIEW_TYPES.find((t) => t.value === iv.interview_type)?.label ??
                        iv.interview_type}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(iv.scheduled_at).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                    {iv.location && (
                      <p className="text-sm text-gray-500 truncate">{iv.location}</p>
                    )}
                    {iv.notes && (
                      <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{iv.notes}</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteInterview(iv.id)}
                  className="text-xs text-gray-400 hover:text-red-600 shrink-0 mt-0.5 font-medium"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const inputCls =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";
