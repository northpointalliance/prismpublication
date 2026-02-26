const normalizedBase = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/+$/, "");

const toAbsolutePath = (path: string) => {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  if (!path.startsWith("/")) {
    return `${normalizedBase}/${path}`;
  }
  return `${normalizedBase}${path}`;
};

const parseErrorMessage = async (response: Response) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      const json = await response.json();
      return json.error || "Request failed";
    } catch (_err) {
      return "Request failed";
    }
  }
  return (await response.text()) || "Request failed";
};

export const apiRequest = async <T>(
  path: string,
  init?: RequestInit,
  extraHeaders?: Record<string, string>,
): Promise<T> => {
  const headers = new Headers(init?.headers || {});
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (extraHeaders) {
    Object.entries(extraHeaders).forEach(([key, value]) => headers.set(key, value));
  }

  const response = await fetch(toAbsolutePath(path), {
    ...init,
    headers,
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new Error(message);
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }
  return undefined as T;
};

export const runtimeConfig = {
  apiBaseUrl: normalizedBase,
  botgridApiKey: import.meta.env.VITE_BOTGRID_API_KEY || "",
  adminKey: import.meta.env.VITE_ADMIN_KEY || "",
};
