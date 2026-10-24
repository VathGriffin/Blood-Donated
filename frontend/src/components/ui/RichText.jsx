'use client';
import { Fragment, useMemo } from 'react';
import { Box } from '@mui/material';
import { RICH_TAGS, SAFE_LINK, looksLikeHtml, paragraphs } from '@/lib/richText';

const ALLOWED = new Set(RICH_TAGS);

// DOM node → React elements, keeping only allowlisted tags and safe links. Anything else is
// unwrapped to its text, so even unexpected markup can never become live HTML. No innerHTML.
function toReact(node, key) {
  if (node.nodeType === 3) return node.textContent;
  if (node.nodeType !== 1) return null;
  const tag = node.tagName.toLowerCase();
  const children = Array.from(node.childNodes).map((c, i) => toReact(c, i));
  if (!ALLOWED.has(tag)) return <Fragment key={key}>{children}</Fragment>;
  if (tag === 'br') return <br key={key} />;
  if (tag === 'a') {
    const href = node.getAttribute('href') || '';
    if (!SAFE_LINK.test(href)) return <Fragment key={key}>{children}</Fragment>;
    return <a key={key} href={href} target="_blank" rel="noopener noreferrer nofollow">{children}</a>;
  }
  const Tag = tag;
  return <Tag key={key}>{children}</Tag>;
}

const plainParagraphs = (text) => paragraphs(text).map((p, i) => <p key={i}>{p}</p>);

function toContent(value) {
  if (!looksLikeHtml(value)) return plainParagraphs(value);
  // Server render: saved HTML only arrives client-side, but never print markup as text.
  if (typeof DOMParser === 'undefined') {
    return plainParagraphs(value.replace(/<\/(p|h2|h3|li)>/gi, '\n\n').replace(/<[^>]*>/g, ''));
  }
  const doc = new DOMParser().parseFromString(`<body>${value}</body>`, 'text/html');
  return Array.from(doc.body.childNodes).map((n, i) => toReact(n, i));
}

/**
 * Shows a rich-text field (editor HTML or legacy plain text) safely. Styling of the produced
 * p / h2 / h3 / ul / ol / a elements comes from `sx`, so each page can match its own type scale.
 */
export default function RichText({ value, sx }) {
  const content = useMemo(() => toContent(value), [value]); // parsing is the costly part
  return (
    <Box sx={{
      '& > :first-of-type': { mt: 0 }, '& > :last-child': { mb: 0 },
      '& p': { m: 0, '& + p, & + ul, & + ol, & + h2, & + h3': { mt: '0.75em' } },
      '& ul, & ol': { my: '0.75em', pl: '1.4em' },
      '& li': { my: '0.25em', '& > p': { m: 0 } },
      '& ul li::marker': { color: '#d32f2f' },
      '& ol li::marker': { color: '#d32f2f', fontWeight: 700 },
      '& h2, & h3': { mt: '1em', mb: '0.4em', lineHeight: 1.25, fontWeight: 800, color: 'text.primary' },
      '& h2': { fontSize: '1.3em' },
      '& h3': { fontSize: '1.12em' },
      '& a': { color: '#c62828', fontWeight: 600, textUnderlineOffset: '2px' },
      '& strong': { fontWeight: 700, color: 'text.primary' },
      ...sx,
    }}>
      {content}
    </Box>
  );
}
