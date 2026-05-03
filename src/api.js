export const API_BASE_URL = getApiBaseUrl();

export async function apiFetch(path, options = {}) {
  const requestUrl = `${API_BASE_URL}${path}`;
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(options.headers || {})
  };

  if (options.body && !isFormData) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const response = await fetch(requestUrl, {
      ...options,
      credentials: "include",
      headers
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || "API алдаа гарлаа.");
    }

    return response.json();
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("API server-тэй холбогдож чадсангүй.");
    }

    throw error;
  }
}

function getApiBaseUrl() {
  if (window.LADY_RIDERS_API_BASE_URL) {
    return window.LADY_RIDERS_API_BASE_URL;
  }

  const localHosts = ["localhost", "127.0.0.1", ""];
  const isLocal = localHosts.includes(window.location.hostname);

  if (isLocal && window.location.port !== "3000") {
    return "http://localhost:3000";
  }

  return "";
}
