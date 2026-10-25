import API_BASE from '@/lib/config';

// Turns an axios error into text for the user. With no HTTP response at all, the request never
// reached the API (server not running, wrong NEXT_PUBLIC_API_URL, or blocked by CORS), so say so
// instead of a generic "failed" that sends people hunting for a wrong password.
export function apiErrorMessage(err, fallback) {
  const data = err?.response?.data;
  if (err?.response) return data?.message || data?.error || data?.errors?.[0]?.msg || fallback;
  return `Can't reach the server at ${API_BASE}. Make sure the backend is running and try again.`;
}
