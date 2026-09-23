// CMS API client. Cookies carry the session; the server checks the request origin.
export class ApiError extends Error {
  constructor(status, message, errors = {}) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

async function request(method, path, { body, formData } = {}) {
  const headers = { Accept: 'application/json' };
  let payload;
  if (formData) {
    payload = formData;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(path, { method, headers, body: payload, credentials: 'same-origin' });
  } catch {
    throw new ApiError(0, 'Cannot reach the kiosk server. Check that it is running and try again.');
  }

  if (response.status === 204) return null;
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    // A session that expired mid-use sends the app back to the sign-in page.
    if (response.status === 401 && !path.startsWith('/api/auth/')) {
      window.dispatchEvent(new Event('cms:unauthorized'));
    }
    throw new ApiError(response.status, data?.error ?? `Request failed (${response.status})`, data?.errors);
  }
  return data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, { body }),
  put: (path, body) => request('PUT', path, { body }),
  delete: (path) => request('DELETE', path),
  upload(path, file) {
    const formData = new FormData();
    formData.append('file', file);
    return request('POST', path, { formData });
  }
};
