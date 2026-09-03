// Zod-validated environment configuration, fail-fast on startup.
//
// The only file in src/ that reads process.env (architecture.md AD-7). Every
// other module imports the parsed `env` object from here. Startup throws — and
// the process exits — when a required variable is missing or malformed, so a
// misconfigured deployment fails immediately rather than at the first request
// that needs the value.

import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().max(65535).default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  // Application connection string (persistence-conventions.md PC-1). The Prisma
  // driver adapter in src/lib/prisma.ts consumes it; migrations read their own
  // copy through prisma.config.ts.
  DATABASE_URL: z.string().min(1),

  // Explicit CORS allow-list, comma-separated (security-conventions.md SC-5).
  // A wildcard is never accepted here — the list is the exact set of origins.
  CORS_ALLOWED_ORIGINS: z
    .string()
    .min(1)
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0),
    )
    .refine((origins) => origins.length > 0 && !origins.includes('*'), {
      message: 'must be a non-empty comma-separated list of origins, never "*"',
    }),

  // Reverse-proxy hop count, never a blanket `true` (security-conventions.md
  // SC-5, SR-8): the per-IP rate limit depends on a trustworthy client IP.
  TRUST_PROXY: z.coerce.number().int().min(0).max(10).default(0),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  throw new Error(
    `Invalid environment configuration:\n${issues}\n\n` +
      'See .env.example for every required variable and its expected shape.',
  );
}

export type Env = z.infer<typeof EnvSchema>;

export const env: Env = Object.freeze(parsed.data);

/**
 * Argon2id cost parameters — decided by a human on 2026-09-01
 * (security-conventions.md SC-1). Constants, never environment variables, so no
 * environment can silently weaken password hashing (SR-2). Passed explicitly on
 * every hash call by src/lib/password.ts.
 */
export const ARGON2ID_PARAMETERS = Object.freeze({
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
});
