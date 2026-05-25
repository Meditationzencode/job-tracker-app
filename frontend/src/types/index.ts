export type JobStatus =
  | "wishlist"
  | "applied"
  | "phone_screen"
  | "interview"
  | "offer"
  | "rejected"
  | "withdrawn"
  | "accepted";

export type InterviewType =
  | "phone"
  | "technical"
  | "behavioral"
  | "onsite"
  | "panel"
  | "other";

export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  date_joined: string;
}

export interface Interview {
  id: number;
  job: number;
  interview_type: InterviewType;
  scheduled_at: string;
  location: string;
  notes: string;
  completed: boolean;
  created_at: string;
}

export interface Contact {
  id: number;
  job: number;
  name: string;
  title: string;
  email: string;
  phone: string;
  linkedin: string;
  notes: string;
  created_at: string;
}

export interface Job {
  id: number;
  company: string;
  title: string;
  location: string;
  remote: boolean;
  url: string;
  description: string;
  status: JobStatus;
  salary_min: number | null;
  salary_max: number | null;
  notes: string;
  cv_version: string;
  cover_letter_version: string;
  date_applied: string | null;
  deadline: string | null;
  archived: boolean;
  interviews: Interview[];
  contacts: Contact[];
  created_at: string;
  updated_at: string;
}

export interface JobListItem
  extends Pick<Job, "id" | "company" | "title" | "location" | "remote" | "status" | "date_applied" | "deadline" | "archived" | "created_at"> {}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface DashboardData {
  totals: {
    total: number;
    active: number;
  };
  status_counts: Partial<Record<JobStatus, number>>;
  upcoming_interviews: Interview[];
  approaching_deadlines: JobListItem[];
  recent_jobs: JobListItem[];
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  password_confirm: string;
  first_name?: string;
  last_name?: string;
}
