import 'server-only'
import { z } from 'zod'

// Validated lazily (per-call), not at module load time. This keeps a
// missing/incomplete Loyverse configuration from crashing routes that have
// nothing to do with Loyverse — only the integration endpoints themselves
// fail, with a clean error, until the operator finishes configuration.
const loyverseEnvSchema = z.object({
  LOYVERSE_CLIENT_ID: z.string().min(1, 'LOYVERSE_CLIENT_ID is required'),
  LOYVERSE_CLIENT_SECRET: z.string().min(1, 'LOYVERSE_CLIENT_SECRET is required'),
  LOYVERSE_REDIRECT_URI: z
    .string()
    .url('LOYVERSE_REDIRECT_URI must be a valid absolute URL'),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url('NEXT_PUBLIC_APP_URL must be a valid absolute URL'),
  LOYVERSE_TOKEN_ENCRYPTION_KEY: z
    .string()
    .refine((value) => {
      try {
        return Buffer.from(value, 'base64').length === 32
      } catch {
        return false
      }
    }, 'LOYVERSE_TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key — generate with `openssl rand -base64 32`'),
})

export type LoyverseEnv = z.infer<typeof loyverseEnvSchema>

export class LoyverseConfigError extends Error {
  constructor(message = 'Loyverse integration is not configured') {
    super(message)
    this.name = 'LoyverseConfigError'
  }
}

/**
 * Reads and validates Loyverse-related environment variables on demand.
 * Throws LoyverseConfigError (never the raw Zod error, which could list
 * variable names but never their values) if configuration is incomplete.
 */
export function getLoyverseEnv(): LoyverseEnv {
  const parsed = loyverseEnvSchema.safeParse(process.env)

  if (!parsed.success) {
    const missing = parsed.error.issues.map((issue) => issue.path.join('.')).join(', ')
    console.error(`Loyverse configuration invalid or incomplete: ${missing}`)
    throw new LoyverseConfigError(
      'Loyverse integration is not configured. Check LOYVERSE_* variables against .env.example.',
    )
  }

  return parsed.data
}
