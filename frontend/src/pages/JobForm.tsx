import { useEffect, useState, type FormEvent, type ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createJob, getJob, updateJob } from "@/api/jobs";
import type { Job, JobStatus } from "@/types";

const ALL_STATUSES: JobStatus[] = [
  "wishlist", "applied", "phone_screen", "interview", "offer", "rejected", "withdrawn", "accepted",
];

type FormState = {
  company: string;
  title: string;
  location: string;
  remote: boolean;
  url: string;
  status: JobStatus;
  salary_min: string;
  salary_max: string;
  date_applied: string;
  deadline: string;
  notes: string;
  description: string;
};

const EMPTY: FormState = {
  company: "",
  title: "",
  location: "",
  remote: false,
  url: "",
  status: "wishlist",
  salary_min: "",
  salary_max: "",
  date_applied: "",
  deadline: "",
  notes: "",
  description: "",
};

function jobToForm(job: Job): FormState {
  return {
    company: job.company,
    title: job.title,
    location: job.location,
    remote: job.remote,
    url: job.url,
    status: job.status,
    salary_min: job.salary_min != null ? String(job.salary_min) : "",
    salary_max: job.salary_max != null ? String(job.salary_max) : "",
    date_applied: job.date_applied ?? "",
    deadline: job.deadline ?? "",
    notes: job.notes,
    description: job.description,
  };
}

function formToPayload(f: FormState): Partial<Job> {
  return {
    company: f.company,
    title: f.title,
    location: f.location,
    remote: f.remote,
    url: f.url,
    status: f.status,
    salary_min: f.salary_min ? Number(f.salary_min) : null,
    salary_max: f.salary_max ? Number(f.salary_max) : null,
    date_applied: f.date_applied || null,
    deadline: f.deadline || null,
    notes: f.notes,
    description: f.description,
  };
}

export default function JobForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEdit || !id) return;
    getJob(Number(id))
      .then((job) => setForm(jobToForm(job)))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = formToPayload(form);
      const saved = isEdit
        ? await updateJob(Number(id), payload)
        : await createJob(payload);
      navigate(`/jobs/${saved.id}`);
    } catch {
      setError("Something went wrong. Please check your inputs and try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        {isEdit ? "Edit job" : "Add job"}
      </h1>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        {/* Core fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Company *">
            <input
              name="company"
              required
              value={form.company}
              onChange={handleChange}
              className={inputCls}
              placeholder="Acme Corp"
            />
          </Field>
          <Field label="Job title *">
            <input
              name="title"
              required
              value={form.title}
              onChange={handleChange}
              className={inputCls}
              placeholder="Software Engineer"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Location">
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              className={inputCls}
              placeholder="New York, NY"
            />
          </Field>
          <Field label="Status">
            <select name="status" value={form.status} onChange={handleChange} className={inputCls}>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            name="remote"
            checked={form.remote}
            onChange={handleChange}
            className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          Remote position
        </label>

        <Field label="Job posting URL">
          <input
            name="url"
            type="url"
            value={form.url}
            onChange={handleChange}
            className={inputCls}
            placeholder="https://..."
          />
        </Field>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Date applied">
            <input
              name="date_applied"
              type="date"
              value={form.date_applied}
              onChange={handleChange}
              className={inputCls}
            />
          </Field>
          <Field label="Application deadline">
            <input
              name="deadline"
              type="date"
              value={form.deadline}
              onChange={handleChange}
              className={inputCls}
            />
          </Field>
        </div>

        {/* Salary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Salary min ($)">
            <input
              name="salary_min"
              type="number"
              min="0"
              value={form.salary_min}
              onChange={handleChange}
              className={inputCls}
              placeholder="60000"
            />
          </Field>
          <Field label="Salary max ($)">
            <input
              name="salary_max"
              type="number"
              min="0"
              value={form.salary_max}
              onChange={handleChange}
              className={inputCls}
              placeholder="90000"
            />
          </Field>
        </div>

        {/* Notes */}
        <Field label="Notes">
          <textarea
            name="notes"
            rows={4}
            value={form.notes}
            onChange={handleChange}
            className={inputCls}
            placeholder="Referral from Jane, strong culture fit..."
          />
        </Field>

        <Field label="Job description">
          <textarea
            name="description"
            rows={4}
            value={form.description}
            onChange={handleChange}
            className={inputCls}
            placeholder="Paste the job description here..."
          />
        </Field>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-5 py-2 rounded-lg text-sm disabled:opacity-50"
          >
            {saving ? "Saving..." : isEdit ? "Save changes" : "Add job"}
          </button>
          <button
            type="button"
            onClick={() => navigate(isEdit ? `/jobs/${id}` : "/jobs")}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
