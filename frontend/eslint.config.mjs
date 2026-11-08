import { FlatCompat } from "@eslint/eslintrc";

// Next.js recommended rules (incl. React hooks and Core Web Vitals checks).
const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const config = [
  { ignores: [".next/**", "node_modules/**", "out/**"] },
  // ESLint 9 only lints .js/.mjs/.cjs unless a config names other files; without this every
  // .jsx file (nearly all pages and components) was silently skipped.
  { files: ["**/*.{js,jsx,mjs,cjs}"] },
  ...compat.extends("next/core-web-vitals"),
  // Flag leftover imports and variables (function arguments are allowed to go unused).
  { rules: { "no-unused-vars": ["warn", { args: "none", ignoreRestSiblings: true }] } },
];

export default config;
