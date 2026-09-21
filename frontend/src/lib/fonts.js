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
