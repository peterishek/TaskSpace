const BASE_URL = "http://127.0.0.1:9000/api/";
const TASKS_URL = `${BASE_URL}tasks/`;

// Define a type/interface for your Task payload matching your frontend state
export interface TaskPayload {
  id?: string | number;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  status: "to-do" | "in-progress" | "done";
}

interface TokenResponse {
  access: string;
  refresh: string;
}

interface RefreshResponse {
  access: string;
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("access");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// --- Auth ---

export async function register(username: string, email: string, password: string): Promise<any> {
  const res = await fetch(`${BASE_URL}register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    // Flatten any nested Django-style error array responses safely
    const errorText = Object.values(errData)
      .flatMap((val) => (Array.isArray(val) ? val : [val]))
      .join(" ");
    throw new Error(errorText || "Registration failed");
  }
  return res.json();
}

export async function login(username: string, password: string): Promise<TokenResponse> {
  const res = await fetch(`${BASE_URL}token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error("Login failed");

  const data: TokenResponse = await res.json();
  localStorage.setItem("access", data.access);
  localStorage.setItem("refresh", data.refresh);
  return data;
}

export async function refreshAccessToken(): Promise<string> {
  const refresh = localStorage.getItem("refresh");
  if (!refresh) throw new Error("No refresh token stored");

  const res = await fetch(`${BASE_URL}token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) throw new Error("Token refresh failed");

  const data: RefreshResponse = await res.json();
  localStorage.setItem("access", data.access);
  return data.access;
}

export function logout(): void {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
}

// --- Tasks ---

async function authedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  let res = await fetch(url, { ...options, headers: authHeaders() });
  if (res.status === 401) {
    try {
      await refreshAccessToken();
      // Retry once with new valid headers
      res = await fetch(url, { ...options, headers: authHeaders() });
    } catch {
      // If refresh fails, clear auth data
      logout();
      throw new Error("Session expired. Please log in again.");
    }
  }
  return res;
}

export async function getTasks(): Promise<any> {
  const res = await authedFetch(TASKS_URL);
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

export async function createTask(task: TaskPayload): Promise<TaskPayload> {
  const res = await authedFetch(TASKS_URL, {
    method: "POST",
    body: JSON.stringify(task),
  });
  if (!res.ok) throw new Error("Failed to create task");
  return res.json();
}

export async function updateTask(id: string | number, task: TaskPayload): Promise<TaskPayload> {
  const res = await authedFetch(`${TASKS_URL}${id}/`, {
    method: "PATCH",
    body: JSON.stringify(task),
  });
  if (!res.ok) throw new Error("Failed to update task");
  return res.json();
}

export async function deleteTask(id: string | number): Promise<void> {
  const res = await authedFetch(`${TASKS_URL}${id}/`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete task");
}