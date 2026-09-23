// Hosts allowed in QR codes, e.g. VITE_QR_ALLOWED_HOSTS=library.example.edu,example.edu
// (subdomains of a listed host are allowed too). When unset, any https URL is allowed.
const allowedHosts = (import.meta.env.VITE_QR_ALLOWED_HOSTS ?? '')
  .split(',')
  .map((host) => host.trim().toLowerCase())
  .filter(Boolean);

// Returns a URL object if the link is safe to show as a QR code, otherwise null.
// Rejects non-https schemes (javascript:, data:, http:) and hosts outside the allowlist,
// so an edited database row can't turn the kiosk into a phishing QR code.
export function getSafeUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;
  if (allowedHosts.length === 0) return url;

  const host = url.hostname.toLowerCase();
  const allowed = allowedHosts.some((allowedHost) => host === allowedHost || host.endsWith(`.${allowedHost}`));
  return allowed ? url : null;
}

export function describeAllowedHosts() {
  return allowedHosts.length ? allowedHosts.join(', ') : 'any https site';
}
