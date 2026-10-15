// Where to send the user after login/register: the `?next=` path the page was opened with, so
// e.g. the blood-request form can bring them back. Only same-site paths are accepted ("/x", not
// "//evil.com" or "https://…"), so the parameter can't be used to redirect people off the site.
export const nextPath = (fallback) => {
  if (typeof window === 'undefined') return fallback;
  const next = new URLSearchParams(window.location.search).get('next');
  return next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : fallback;
};

// "?next=…" to carry the destination on to another auth page, or "" when there is none.
export const nextQuery = () => {
  if (typeof window === 'undefined') return '';
  const next = nextPath('');
  return next ? `?next=${encodeURIComponent(next)}` : '';
};
