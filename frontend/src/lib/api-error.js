import API_BASE from '@/lib/config';

// Turns an axios error into text for the user. With no HTTP response at all, the request never
// reached the API (server not running, wrong NEXT_PUBLIC_API_URL, or blocked by CORS), so say so
// instead of a generic "failed" that sends people hunting for a wrong password.
export function apiErrorMessage(err, fallback) {
  if (err?.response) return err.response.data?.message || err.response.data?.error || fallback;
  return `Can't reach the server at ${API_BASE}. Make sure the backend is running and try again.`;
}
