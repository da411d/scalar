---
'@scalar/nuxt': patch
---

fix: resolve CJS dependency pre-bundling in Vite dev mode

Fixed CommonJS transitive dependencies not being pre-bundled by Vite's optimizeDeps, which caused "does not provide an export named" errors in the browser during development. The optimizeDeps.include entries now directly list the CJS package names instead of using the '@scalar/nuxt >' prefix syntax.
