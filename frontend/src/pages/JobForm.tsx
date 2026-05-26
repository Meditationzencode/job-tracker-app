import { useEffect, useState, type FormEvent, type ChangeEvent, type FocusEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createJob, getJob, updateJob } from "@/api/jobs";
import { useToast } from "@/context/ToastContext";
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
  cv_version: string;
  cover_letter_version: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

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
  cv_version: "",
  cover_letter_version: "",
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
    cv_version: job.cv_version,
    cover_letter_version: job.cover_letter_version,
  };
}

function formToPayload(f: FormState): Partial<Job> {
  return {
    company: f.company.trim(),
    title: f.title.trim(),
    location: f.location.trim(),
    remote: f.remote,
    url: f.url.trim(),
    status: f.status,
    salary_min: f.salary_min ? Number(f.salary_min) : null,
    salary_max: f.salary_max ? Number(f.salary_max) : null,
    date_applied: f.date_applied || null,
    deadline: f.deadline || null,
    notes: f.notes,
    description: f.description,
    cv_version: f.cv_version.trim(),
    cover_letter_version: f.cover_letter_version.trim(),
  };
}

function validate(f: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!f.company.trim()) errors.company = "Company is required.";
  if (!f.title.trim()) errors.title = "Job title is required.";

  if (f.url.trim()) {
    try {
      new URL(f.url.trim());
    } catch {
      errors.url = "Enter a valid URL (e.g. https://example.com).";
    }
  }

  if (f.salary_min && Number(f.salary_min) < 0) {
    errors.salary_min = "Cannot be negative.";
  }
  if (f.salary_max && Number(f.salary_max) < 0) {
    errors.salary_max = "Cannot be negative.";
  }
  if (
    f.salary_min &&
    f.salary_max &&
    Number(f.salary_max) < Number(f.salary_min)
  ) {
    errors.salary_max = "Max salary must be at least the minimum.";
  }

  if (f.date_applied && f.deadline && f.deadline < f.date_applied) {
    errors.deadline = "Deadline can't be before the applied date.";
  }

  return errors;
}

export default function JobForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { notify } = useToast();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");

  const errors = validate(form);
  const hasErrors = Object.keys(errors).length > 0;

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

  function handleBlur(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
  }

  function showError(name: keyof FormState): string | undefined {
    return touched[name] ? errors[name] : undefined;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError("");

    // Touch everything so any remaining errors show
    setTouched({
      company: true, title: true, location: true, url: true,
      salary_min: true, salary_max: true, date_applied: true, deadline: true,
    });

    if (hasErrors) {
      notify("Please fix the errors highlighted below.", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = formToPayload(form);
      const saved = isEdit
        ? await updateJob(Number(id), payload)
        : await createJob(payload);
      notify(isEdit ? "Changes saved" : "Job added");
      navigate(`/jobs/${saved.id}`);
    } catch {
      setServerError("Something went wrong on the server. Please try again.");
      notify("Save failed", "error");
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

      {serverError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {serverError}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-white rounded-xl border border-gray-200 p-6 space-y-5"
      >
        {/* Core fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Company *" error={showError("company")}>
            <input
              name="company"
              value={form.company}
              onChange={handleChange}
              onBlur={handleBlur}
              className={inputCls(!!showError("company"))}
              placeholder="Acme Corp"
              aria-invalid={!!showError("company")}
            />
          </Field>
          <Field label="Job title *" error={showError("title")}>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              onBlur={handleBlur}
              className={inputCls(!!showError("title"))}
              placeholder="Software Engineer"
              aria-invalid={!!showError("title")}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Location">
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              onBlur={handleBlur}
              className={inputCls(false)}
              placeholder="New York, NY"
            />
          </Field>
          <Field label="Status">
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className={inputCls(false)}
            >
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

        <Field label="Job posting URL" error={showError("url")}>
          <input
            name="url"
            type="url"
            value={form.url}
            onChange={handleChange}
            onBlur={handleBlur}
            className={inputCls(!!showError("url"))}
            placeholder="https://..."
            aria-invalid={!!showError("url")}
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
              onBlur={handleBlur}
              className={inputCls(false)}
            />
          </Field>
          <Field label="Application deadline" error={showError("deadline")}>
            <input
              name="deadline"
              type="date"
              value={form.deadline}
              onChange={handleChange}
              onBlur={handleBlur}
              className={inputCls(!!showError("deadline"))}
              aria-invalid={!!showError("deadline")}
            />
          </Field>
        </div>

        {/* Salary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Salary min ($)" error={showError("salary_min")}>
            <input
              name="salary_min"
              type="number"
              min="0"
              value={form.salary_min}
              onChange={handleChange}
              onBlur={handleBlur}
              className={inputCls(!!showError("salary_min"))}
              placeholder="60000"
              aria-invalid={!!showError("salary_min")}
            />
          </Field>
          <Field label="Salary max ($)" error={showError("salary_max")}>
            <input
              name="salary_max"
              type="number"
              min="0"
              value={form.salary_max}
              onChange={handleChange}
              onBlur={handleBlur}
              className={inputCls(!!showError("salary_max"))}
              placeholder="90000"
              aria-invalid={!!showError("salary_max")}
            />
          </Field>
        </div>

        {/* Application materials */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="CV / resume version">
            <input
              name="cv_version"
              value={form.cv_version}
              onChange={handleChange}
              onBlur={handleBlur}
              className={inputCls(false)}
              placeholder="Resume v3 — backend focus"
            />
          </Field>
          <Field label="Cover letter version">
            <input
              name="cover_letter_version"
              value={form.cover_letter_version}
              onChange={handleChange}
              onBlur={handleBlur}
              className={inputCls(false)}
              placeholder="Cover letter v2"
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
            className={inputCls(false)}
            placeholder="Referral from Jane, strong culture fit..."
          />
        </Field>

        <Field label="Job description">
          <textarea
            name="description"
            rows={4}
            value={form.description}
            onChange={handleChange}
            className={inputCls(false)}
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

function inputCls(hasError: boolean): string {
  const base = "w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2";
  return hasError
    ? `${base} border-red-300 focus:ring-red-500 bg-red-50`
    : `${base} border-gray-300 focus:ring-brand-500`;
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
