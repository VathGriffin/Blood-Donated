import localFont from 'next/font/local';

// Fonts are self-hosted (files in src/fonts) instead of loaded with next/font/google.
// next/font/google downloads the font from Google's servers on every `next build`, so the build
// depends on a third-party server answering correctly for that build machine — and when Google
// returns a font URL without a file extension, Next.js crashes with
// "TypeError: Cannot read properties of null (reading '1')" (see the note in src/fonts/README.md).
// Local files make the build deterministic and offline-safe, and serve identical typefaces.

// Body font: Inter (variable, latin subset, weights 100–900).
export const inter = localFont({
  src: '../fonts/Inter-latin.woff2',
  weight: '100 900',
  style: 'normal',
  display: 'swap',
  variable: '--font-inter', // read by lib/design-tokens.js and the MUI theme
});

// Decorative handwriting used for slogans (variable, latin subset, weights 400–700).
// If the file ever failed to load, the text falls back to a cursive system font, not to Arial.
export const script = localFont({
  src: '../fonts/Caveat-latin.woff2',
  weight: '400 700',
  style: 'normal',
  display: 'swap',
  adjustFontFallback: false,
  fallback: ['Segoe Script', 'Brush Script MT', 'Lucida Handwriting', 'cursive'],
});

// Inter's Vietnamese letters (ạ, ế, ữ…), which the latin file above lacks. Same family look; only
// those letters are in this file. No fallback font of its own, so every other letter falls
// through to Inter (see `fontFamily` in lib/design-tokens.js).
// `unicode-range` (the ranges Google publishes for these subsets) is what makes the browser
// download the file only when such letters are on screen: without it every visitor would fetch
// it, and the text would visibly re-draw when it arrived. Not preloaded for the same reason.
export const interVietnamese = localFont({
  src: '../fonts/Inter-vietnamese.woff2',
  weight: '100 900',
  style: 'normal',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
  fallback: [],
  variable: '--font-inter-vi',
  declarations: [{ prop: 'unicode-range', value: 'U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB' }],
});

// Khmer text (Noto Sans Khmer, variable, khmer subset). Like interVietnamese: Khmer letters only,
// downloaded only when Khmer text is on screen.
export const khmer = localFont({
  src: '../fonts/NotoSansKhmer-khmer.woff2',
  weight: '100 900',
  style: 'normal',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
  fallback: [],
  variable: '--font-khmer',
  declarations: [{ prop: 'unicode-range', value: 'U+1780-17FF, U+19E0-19FF, U+200C-200D, U+25CC' }],
});
