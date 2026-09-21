'use client';
import React from 'react';
import Link from 'next/link';
import { Box, Typography, useTheme } from '@mui/material';

// Lightweight markdown for assistant replies: **bold**, [text](/internal-path) links, "- "/"• "
// bullets, "1. " numbered lines and blank lines as spacing. Nothing is ever injected as HTML —
// every node is a React element — and only same-site links (a single leading "/") are turned
// into links, so a reply can never point the user at an external or javascript: URL.
const INLINE = /(\*\*[^*]+\*\*|\[[^\]]+\]\(\/(?!\/)[^)\s\\]*\))/g;
const LINK = /^\[([^\]]+)\]\((\/[^)]*)\)$/;

function renderInline(text, keyPrefix, linkColor) {
  return text.split(INLINE).map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) return <strong key={key}>{part.slice(2, -2)}</strong>;
    const link = part.match(LINK);
    if (link) {
      return (
        <Link key={key} href={link[2]} style={{ color: linkColor, fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 2 }}>
          {link[1]}
        </Link>
      );
    }
    return <React.Fragment key={key}>{part}</React.Fragment>;
  });
}

export default function ChatMessage({ text, fontSize = '0.85rem', lineHeight = 1.7 }) {
  const isDark = useTheme().palette.mode === 'dark';
  const linkColor = isDark ? '#ef9a9a' : '#b71c1c';
  const blocks = [];
  let listBuffer = [];
  let listType = 'ul'; // numbered steps stay numbered
  let blockKey = 0;

  const flushList = () => {
    if (!listBuffer.length) return;
    const key = blockKey++;
    blocks.push(
      <Box component={listType} key={`${listType}-${key}`} sx={{ m: 0, pl: 2.6, my: 0.4 }}>
        {listBuffer.map((item, i) => (
          <Box component="li" key={i} sx={{ fontSize, lineHeight }}>{renderInline(item, `li-${key}-${i}`, linkColor)}</Box>
        ))}
      </Box>
    );
    listBuffer = [];
  };

  String(text || '').split('\n').forEach((line) => {
    const bullet = line.match(/^\s*[-•]\s+(.*)/);
    const numbered = line.match(/^\s*\d+\.\s+(.*)/);
    if (bullet || numbered) {
      const type = numbered ? 'ol' : 'ul';
      if (listBuffer.length && type !== listType) flushList();
      listType = type;
      listBuffer.push((bullet || numbered)[1]);
      return;
    }
    flushList();
    const key = blockKey++;
    blocks.push(
      line.trim() === ''
        ? <Box key={`sp-${key}`} sx={{ height: 6 }} />
        : <Typography key={`p-${key}`} variant="body2" sx={{ fontSize, lineHeight, wordBreak: 'break-word' }}>{renderInline(line, `p-${key}`, linkColor)}</Typography>
    );
  });
  flushList();

  return <Box>{blocks}</Box>;
}
