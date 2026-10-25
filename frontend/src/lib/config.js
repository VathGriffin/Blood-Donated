const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// In a deployed (production) build the localhost fallback can never work for a visitor — surface it
// in the browser console so the cause is obvious instead of a page full of "network error"s.
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_API_URL) {
  console.error('NEXT_PUBLIC_API_URL was not set when this site was built, so API calls go to http://localhost:3001 and will fail. Set it to your deployed backend URL and redeploy.');
}

// Uploaded files are stored as "/uploads/…" paths on the API server; absolute URLs pass through.
export const uploadUrl = (path) => (!path ? undefined : /^https?:\/\//.test(path) ? path : `${API_BASE}${path}`);

export default API_BASE;
