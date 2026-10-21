import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import reactHooks from "eslint-plugin-react-hooks";

const eslintConfig = defineConfig([
  ...nextVitals,

  // React Compiler (react-hooks v6+/v7) preview rules that Next's
  // core-web-vitals enables by default. They are aggressive and fire on
  // intentional, idiomatic patterns in this codebase:
  //   - set-state-in-effect: the standard async data-fetch loading-flag
  //     idiom (load() sets `loading=true` before its first await).
  //   - refs: a render-phase "latest value" ref mirror in
  //     GuardPreviewProvider that a code comment documents as required
  //     (child effects run before parent effects; moving it into an effect
  //     loses the first-load preview request). Refactoring that to silence
  //     the rule would change working, tested behavior.
  // Kept as warnings so the signal stays visible without failing lint/CI on
  // deliberate code. Revisit if the React Compiler rules stabilize.
  {
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
    },
  },

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // The backend/ dir is a separate Express app (own package.json, no lint
    // config). Its router's `.use()` calls are not React hooks — scanning it
    // with the Next.js/React config produced only false positives.
    "backend/**",
    // Stale agent worktree copies (git-excluded) — not real source.
    ".kilo/**",
    "node_modules/**",
  ]),
]);

export default eslintConfig;
