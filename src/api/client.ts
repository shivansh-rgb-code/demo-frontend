export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getApiBaseUrl(): string {
  const value = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!value) {
    throw new Error(
      "VITE_API_BASE_URL is not set. Copy frontend/.env.example to frontend/.env and set the backend origin.",
    );
  }
  return value.replace(/\/+$/, "");
}

async function readErrorMessage(response: Response): Promise<string> {
  const fallback = response.statusText || `Request failed (${response.status})`;
  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object") {
      const record = body as Record<string, unknown>;
      for (const key of ["message", "detail", "error", "title"]) {
        const value = record[key];
        if (typeof value === "string" && value.trim()) {
          return value;
        }
      }
    }
  } catch {
    /* ignore non-JSON error bodies */
  }
  return fallback;
}

let refreshInFlight: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const response = await fetch(`${getApiBaseUrl()}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      return response.ok;
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
  retryOnUnauthorized = true,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    credentials: "include",
    headers,
  });

  const isAuthPath = path.startsWith("/api/auth/");
  if (response.status === 401 && retryOnUnauthorized && !isAuthPath) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return api<T>(path, options, false);
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response));
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
