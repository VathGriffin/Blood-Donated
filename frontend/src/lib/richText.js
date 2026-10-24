import { EMAIL_RE } from '@/lib/validation';

// Helpers for the About page's rich-text fields. Saved values are either HTML from the editor
// (already cleaned by the backend against the same allowlist) or plain text from before the
// editor existed, where a blank line starts a new paragraph.

export const RICH_TAGS = ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'h2', 'h3', 'a'];
export const SAFE_LINK = /^(https?:|mailto:)/i;

export const looksLikeHtml = (text) => /<\/?[a-z][^>]*>/i.test(text || '');

const escapeHtml = (text) => text
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Plain text with blank lines → paragraphs.
export const paragraphs = (text) => (text || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

// Saved value → editor HTML; plain text keeps its paragraphs and single line breaks.
export const toEditorHtml = (value) => (looksLikeHtml(value)
  ? value
  : paragraphs(value).map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`).join(''));

// Turns "example.org" into "https://example.org"; refuses anything that isn't http(s)/mailto.
export function normalizeLink(input) {
  const url = (input || '').trim();
  if (!url) return null;
  if (SAFE_LINK.test(url)) return url;
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return null; // some other scheme, e.g. javascript:
  if (EMAIL_RE.test(url)) return `mailto:${url}`;
  return `https://${url.replace(/^\/+/, '')}`;
}
