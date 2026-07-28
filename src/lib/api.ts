"use client";

type ApiOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
};

export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(status: number, detail: unknown, message?: string) {
    super(message ?? "Erreur API");
    this.status = status;
    this.detail = detail;
  }
}

function buildUrl(path: string, params?: ApiOptions["params"]) {
  const query = params
    ? "?" +
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join("&")
    : "";
  return `/api/backend/${path.replace(/^\/+/, "")}${query}`;
}

async function request<T>(path: string, options: ApiOptions = {}, retry = true): Promise<T> {
  const res = await fetch(buildUrl(path, options.params), {
    method: options.method ?? "GET",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401 && retry) {
    const refreshed = await fetch("/api/auth/refresh", { method: "POST" });
    if (refreshed.ok) {
      return request<T>(path, options, false);
    }
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new ApiError(401, null, "Session expiree.");
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new ApiError(res.status, data, data?.detail ?? "Une erreur est survenue.");
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, params?: ApiOptions["params"]) => request<T>(path, { method: "GET", params }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
