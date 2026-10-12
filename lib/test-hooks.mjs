import { registerHooks } from "node:module"

// next has no "exports" map, so Node ESM needs the .js extension on its subpaths.
registerHooks({ resolve: (spec, ctx, next) => next(spec === "next/cache" ? "next/cache.js" : spec, ctx) })
