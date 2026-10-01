const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export interface ApiError {
  error: string;
  message: string;
  status: number;
}

let refreshInFlight: Promise<boolean> | null = null;

async function refreshAuthentication(): Promise<boolean> {
  const refreshToken = localStorage.getItem("claimguard_refresh_token");
  if (!refreshToken) return false;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        if (!response.ok) return false;

        const tokens = await response.json() as { idToken?: string; accessToken?: string };
        if (!tokens.idToken || !tokens.accessToken) return false;
        localStorage.setItem("claimguard_token", tokens.idToken);
        localStorage.setItem("claimguard_access_token", tokens.accessToken);
        return true;
      } catch {
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

export async function openEvidence(url: string): Promise<void> {
  if (/^https?:\/\//i.test(url)) {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }

  const viewer = window.open("about:blank", "_blank");
  if (!viewer) throw new Error("Allow pop-ups to view this evidence file.");

  try {
    const token = localStorage.getItem("claimguard_token");
    const origin = new URL(API_BASE_URL, window.location.origin).origin;
    const response = await fetch(new URL(url, origin), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) throw new Error("Unable to retrieve this evidence file.");

    const objectUrl = URL.createObjectURL(await response.blob());
    viewer.location.href = objectUrl;
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  } catch (error) {
    viewer.close();
    throw error;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("claimguard_token");
  const headers = new Headers(options.headers || {});

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Do not set Content-Type if sending FormData (browser automatically sets multipart boundary)
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  try {
    let response = await fetch(url, {
      ...options,
      headers,
    });

    const isAuthEndpoint = /\/auth\/(login|register|confirm|refresh|logout)(?:$|\?)/.test(endpoint);
    if (response.status === 401 && token && !isAuthEndpoint) {
      if (await refreshAuthentication()) {
        headers.set("Authorization", `Bearer ${localStorage.getItem("claimguard_token")}`);
        response = await fetch(url, { ...options, headers });
      } else {
        localStorage.removeItem("claimguard_token");
        localStorage.removeItem("claimguard_access_token");
        localStorage.removeItem("claimguard_refresh_token");
        localStorage.removeItem("claimguard_user");
        window.dispatchEvent(new Event("auth_logout"));
      }
    }

    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText };
      }

      const error: ApiError = {
        error: errorData.error || "API_ERROR",
        message:
          errorData.message ||
          `Request failed with status ${response.status}: ${response.statusText}`,
        status: response.status,
      };
      throw error;
    }

    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  } catch (error: any) {
    if (error.status) throw error;
    throw {
      error: "NETWORK_ERROR",
      message:
        "Unable to connect to the configured API. Please try again later.",
      status: 0,
    } as ApiError;
  }
}
