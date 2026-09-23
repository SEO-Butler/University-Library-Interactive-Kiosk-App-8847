// Kiosk read API. The server lives on the same origin (it also serves this page), so
// paths are relative. VITE_API_BASE can point elsewhere for development.
const API_BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '');

// Requests fail after this long so a flaky network can't leave pages spinning.
const REQUEST_TIMEOUT_MS = 8000;

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function fetchKioskContent() {
  let response;
  try {
    response = await fetch(`${API_BASE}/api/kiosk/content`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
  } catch (error) {
    throw new ApiError(0, `Kiosk server not reachable: ${error.message}`);
  }
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      message = (await response.json()).error ?? message;
    } catch {
      // keep the generic message
    }
    throw new ApiError(response.status, message);
  }
  return response.json();
}

// Media URLs from the API are server-relative (/api/media/<id>).
export function resolveMediaUrl(url) {
  return url ? `${API_BASE}${url}` : null;
}
