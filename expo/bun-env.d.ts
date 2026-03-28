declare global {
  // Minimal Bun global type to satisfy TypeScript without installing @types/bun
  // At runtime, this will be provided when running under Bun. In Node, it may be undefined.
  // We only use Bun.serve in server.ts, so declare just what we need.
  // Do not add comments per instruction when writing files, but here we must replace
}

export {};
