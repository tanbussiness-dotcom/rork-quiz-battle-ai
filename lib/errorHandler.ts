export type StructuredError = {
  message: string;
  name?: string;
  stack?: string;
  code?: string | number;
  path?: string;
  meta?: Record<string, unknown>;
};

export function logError(scope: string, error: unknown, meta: Record<string, unknown> = {}) {
  const err = error as any;
  const payload: StructuredError = {
    message: err?.message ?? String(error),
    name: err?.name,
    stack: err?.stack,
    code: err?.code,
    ...("path" in meta ? { path: meta.path as string } : {}),
    meta,
  };
  console.error(`❌ [${scope}]`, payload);
}

export function jsonError(message: string, status: number = 500) {
  return Response.json({ error: message }, { status });
}
