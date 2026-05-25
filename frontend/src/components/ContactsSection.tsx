import { useState, type FormEvent } from "react";
import { createContact, deleteContact } from "@/api/jobs";
import { useToast } from "@/context/ToastContext";
import type { Contact } from "@/types";

type ContactDraft = {
  name: string;
  title: string;
  email: string;
  phone: string;
  linkedin: string;
  notes: string;
};

const EMPTY_DRAFT: ContactDraft = {
  name: "",
  title: "",
  email: "",
  phone: "",
  linkedin: "",
  notes: "",
};

const inputCls =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

interface Props {
  jobId: number;
  contacts: Contact[];
  onChange: () => Promise<void> | void;
}

export default function ContactsSection({ jobId, contacts, onChange }: Props) {
  const { notify } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<ContactDraft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createContact({ ...draft, job: jobId });
      setDraft(EMPTY_DRAFT);
      setShowForm(false);
      await onChange();
      notify("Contact added");
    } catch {
      notify("Could not add contact", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(contactId: number) {
    if (!confirm("Remove this contact?")) return;
    await deleteContact(contactId);
    await onChange();
    notify("Contact removed");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">
          Contacts
          {contacts.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-400">{contacts.length}</span>
          )}
        </h2>
        <button
          onClick={() => {
            setShowForm((v) => !v);
            setDraft(EMPTY_DRAFT);
          }}
          className="text-sm text-brand-600 hover:text-brand-700 font-medium"
        >
          {showForm ? "Cancel" : "+ Add contact"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 mb-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                required
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                className={inputCls}
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title / role</label>
              <input
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                className={inputCls}
                placeholder="Recruiter, Hiring Manager..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={draft.email}
                onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                className={inputCls}
                placeholder="jane@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                value={draft.phone}
                onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
                className={inputCls}
                placeholder="+1 555 0100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
            <input
              type="url"
              value={draft.linkedin}
              onChange={(e) => setDraft((d) => ({ ...d, linkedin: e.target.value }))}
              className={inputCls}
              placeholder="https://linkedin.com/in/..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              rows={2}
              value={draft.notes}
              onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
              className={inputCls}
              placeholder="Met at the Oct meetup, mentioned the team is hiring..."
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-4 py-1.5 rounded-lg text-sm disabled:opacity-50"
          >
            {saving ? "Saving..." : "Add contact"}
          </button>
        </form>
      )}

      {contacts.length === 0 ? (
        <p className="text-sm text-gray-400">No contacts yet.</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {contacts.map((c) => (
            <div key={c.id} className="px-4 py-3 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium text-gray-900">
                  {c.name}
                  {c.title && <span className="text-gray-500 font-normal"> — {c.title}</span>}
                </p>
                <div className="text-sm text-gray-500 space-x-3 mt-0.5">
                  {c.email && (
                    <a href={`mailto:${c.email}`} className="hover:text-brand-600 hover:underline">
                      {c.email}
                    </a>
                  )}
                  {c.phone && <span>{c.phone}</span>}
                  {c.linkedin && (
                    <a
                      href={c.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-brand-600 hover:underline"
                    >
                      LinkedIn
                    </a>
                  )}
                </div>
                {c.notes && (
                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{c.notes}</p>
                )}
              </div>
              <button
                onClick={() => handleRemove(c.id)}
                className="text-xs text-gray-400 hover:text-red-600 shrink-0 mt-0.5 font-medium"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
