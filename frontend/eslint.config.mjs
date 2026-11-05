import { FlatCompat } from "@eslint/eslintrc";

// Next.js recommended rules (incl. React hooks and Core Web Vitals checks).
const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const config = [
  { ignores: [".next/**", "node_modules/**", "out/**"] },
  ...compat.extends("next/core-web-vitals"),
];

export default config;
