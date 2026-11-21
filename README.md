# `@cloudflare/vitest-plugin`: the runner resolves `vitest/worker` from the project root

The runner of `@cloudflare/vitest-plugin` imports `vitest/worker`. The plugin resolves this import from the Vite project root, not from the plugin package. When the project root cannot resolve `vitest`, no test runs.

## Run

```sh
pnpm install && pnpm test
```

`pnpm test` runs `worker/node_modules/.bin/vitest run --config worker/vitest.config.ts` from the workspace root. The Vite root is the workspace root. The root package does not depend on `vitest`, so `node_modules/vitest` does not exist there.

## Expected

The test in `worker/test/index.test.ts` passes. It passes when you run Vitest from `worker/`:

```sh
cd worker && ./node_modules/.bin/vitest run
```

## Actual

```
[vitest-plugin] Failed to import "/vitest/worker" from "/index.mjs". To resolve this, try bundling the relevant dependency with Vite. ...
Error: [vitest-pool]: Failed to start cloudflare-pool worker for test files .../worker/test/index.test.ts.
Caused by: Error: No such module "vitest/worker".
      Tests  no tests
     Errors  1 error
```

With `NODE_DEBUG=vitest-plugin:module-fallback pnpm test`:

```
import("/vitest/worker") relative to /index.mjs: error: Error: Not found
```

If a parent directory has a `node_modules/vitest` of another version, the runner loads that version instead, and Vitest fails with `Vitest failed to find the runner`. We saw this in a real project. This repository shows only the first case.

## Cause

The pool runs the runner as the workerd module `index.mjs` with `modulesRoot: "/"`. The module fallback service resolves `vitest/worker` with Vite, with the importer `/index.mjs`. That file does not exist, so Vite resolves from its project root.

## Fix

Reported upstream in [cloudflare/workers-sdk#17107](https://github.com/cloudflare/workers-sdk/issues/17107), fixed by [cloudflare/workers-sdk#17108](https://github.com/cloudflare/workers-sdk/pull/17108) (prepared in [Hebilicious/workers-sdk#2](https://github.com/Hebilicious/workers-sdk/pull/2)). It resolves `vitest/worker` from the plugin package, which is where the pool's own `vitest` imports resolve from.

## Versions

- `@cloudflare/vitest-plugin` 1.9.0 (latest)
- `vitest` 5.1.1 (latest)
- pnpm 12.15.0, Node.js 23.10.0, Linux
