import client, { API_ORIGIN } from "./client";
import axios from "axios";
import type { AuthTokens, LoginCredentials, RegisterData, User } from "@/types";

export async function login(credentials: LoginCredentials): Promise<AuthTokens> {
  const { data } = await axios.post<AuthTokens>(`${API_ORIGIN}/api/auth/token/`, credentials);
  localStorage.setItem("access_token", data.access);
  localStorage.setItem("refresh_token", data.refresh);
  return data;
}

export async function register(data: RegisterData): Promise<User> {
  const { data: user } = await client.post<User>("/auth/register/", data);
  return user;
}

export async function getMe(): Promise<User> {
  const { data } = await client.get<User>("/auth/me/");
  return data;
}

export function logout(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}
