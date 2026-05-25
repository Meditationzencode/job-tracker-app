import client from "./client";
import type { Job, JobListItem, Interview, Contact, PaginatedResponse, DashboardData } from "@/types";

export async function getDashboard(): Promise<DashboardData> {
  const { data } = await client.get<DashboardData>("/dashboard/");
  return data;
}

export async function downloadJobsCsv(): Promise<void> {
  const response = await client.get("/jobs/export/", { responseType: "blob" });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = `job-tracker-export-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export interface JobFilters {
  status?: string;
  remote?: boolean;
  archived?: boolean;
  search?: string;
  ordering?: string;
  page?: number;
}

export async function listJobs(filters: JobFilters = {}): Promise<PaginatedResponse<JobListItem>> {
  const { data } = await client.get<PaginatedResponse<JobListItem>>("/jobs/", { params: filters });
  return data;
}

export async function getJob(id: number): Promise<Job> {
  const { data } = await client.get<Job>(`/jobs/${id}/`);
  return data;
}

export async function createJob(payload: Partial<Job>): Promise<Job> {
  const { data } = await client.post<Job>("/jobs/", payload);
  return data;
}

export async function updateJob(id: number, payload: Partial<Job>): Promise<Job> {
  const { data } = await client.patch<Job>(`/jobs/${id}/`, payload);
  return data;
}

export async function deleteJob(id: number): Promise<void> {
  await client.delete(`/jobs/${id}/`);
}

export async function createInterview(payload: Partial<Interview>): Promise<Interview> {
  const { data } = await client.post<Interview>("/interviews/", payload);
  return data;
}

export async function updateInterview(id: number, payload: Partial<Interview>): Promise<Interview> {
  const { data } = await client.patch<Interview>(`/interviews/${id}/`, payload);
  return data;
}

export async function deleteInterview(id: number): Promise<void> {
  await client.delete(`/interviews/${id}/`);
}

export async function createContact(payload: Partial<Contact>): Promise<Contact> {
  const { data } = await client.post<Contact>("/contacts/", payload);
  return data;
}

export async function deleteContact(id: number): Promise<void> {
  await client.delete(`/contacts/${id}/`);
}
