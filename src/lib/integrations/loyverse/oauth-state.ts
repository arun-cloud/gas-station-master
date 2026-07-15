import 'server-only'
import { randomBytes } from 'crypto'
import { cookies } from 'next/headers'

export const OAUTH_STATE_COOKIE = 'loyverse_oauth_state'
const STATE_MAX_AGE_SECONDS = 10 * 60 // 10 minutes — plenty for a login redirect

interface OAuthStateCookiePayload {
  nonce: string
  branchId: string
}

/**
 * Generates a random nonce, stores {nonce, branchId} in a short-lived
 * httpOnly cookie, and returns the nonce to send as the OAuth `state`
 * query parameter. On callback, compareAndConsumeState() checks the
 * returned state against the cookie and yields the original branchId —
 * the branchId is never trusted from the query string itself.
 */
export async function createOAuthState(branchId: string): Promise<{ state: string }> {
  const nonce = randomBytes(32).toString('hex')
  const payload: OAuthStateCookiePayload = { nonce, branchId }

  const cookieStore = await cookies()
  cookieStore.set(OAUTH_STATE_COOKIE, JSON.stringify(payload), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: STATE_MAX_AGE_SECONDS,
  })

  return { state: nonce }
}

export async function compareAndConsumeState(
  returnedState: string | null,
): Promise<{ valid: boolean; branchId: string | null }> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(OAUTH_STATE_COOKIE)?.value
  cookieStore.delete(OAUTH_STATE_COOKIE)

  if (!raw || !returnedState) {
    return { valid: false, branchId: null }
  }

  try {
    const payload = JSON.parse(raw) as OAuthStateCookiePayload
    if (payload.nonce !== returnedState || !payload.branchId) {
      return { valid: false, branchId: null }
    }
    return { valid: true, branchId: payload.branchId }
  } catch {
    return { valid: false, branchId: null }
  }
}
