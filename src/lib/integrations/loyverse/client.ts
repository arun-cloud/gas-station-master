import 'server-only'
import { getLoyverseEnv } from './env'

// ─── Documented Loyverse endpoints used here ────────────────────────────
// https://developer.loyverse.com (OAuth2 authorization code flow + REST API)
//   - Authorize:    GET  https://api.loyverse.com/oauth/authorize
//   - Token/Refresh:POST https://api.loyverse.com/oauth/token
//   - Stores:       GET  https://api.loyverse.com/v1/stores
// No webhook subscription or receipt endpoints are called in this phase —
// those belong to Phase 3B and will be verified against the live developer
// dashboard before implementation, per the "don't invent endpoints" rule.

const LOYVERSE_AUTHORIZE_URL = 'https://api.loyverse.com/oauth/authorize'
const LOYVERSE_TOKEN_URL = 'https://api.loyverse.com/oauth/token'
const LOYVERSE_STORES_URL = 'https://api.loyverse.com/v1/stores'

// Minimum scopes needed for Phase 3B (receipt sync) plus store/employee
// context. Kept identical to what was already requested by the existing
// (prototype) connect route so no re-consent surprises for already-tested
// merchants.
export const LOYVERSE_OAUTH_SCOPES = [
  'RECEIPTS_READ',
  'STORES_READ',
  'ITEMS_READ',
  'EMPLOYEES_READ',
  'POS_DEVICES_READ',
  'PAYMENT_TYPES_READ',
  'MERCHANT_READ',
] as const

export function buildLoyverseAuthorizeUrl(state: string): string {
  const { LOYVERSE_CLIENT_ID, LOYVERSE_REDIRECT_URI } = getLoyverseEnv()

  const url = new URL(LOYVERSE_AUTHORIZE_URL)
  url.searchParams.set('client_id', LOYVERSE_CLIENT_ID)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('redirect_uri', LOYVERSE_REDIRECT_URI)
  url.searchParams.set('scope', LOYVERSE_OAUTH_SCOPES.join(' '))
  url.searchParams.set('state', state)
  return url.toString()
}

export interface LoyverseTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
  scope?: string
}

interface LoyverseTokenErrorResponse {
  error?: string
  error_description?: string
}

export class LoyverseApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = 'LoyverseApiError'
  }
}

async function requestToken(body: URLSearchParams): Promise<LoyverseTokenResponse> {
  const response = await fetch(LOYVERSE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  })

  const data = (await response.json()) as LoyverseTokenResponse | LoyverseTokenErrorResponse

  if (!response.ok || !('access_token' in data) || !data.access_token) {
    // Log only the error code, never the full response (which could echo
    // back client secrets or partial tokens on some providers).
    const errorCode = 'error' in data ? data.error : 'unknown_error'
    console.error(`Loyverse token request failed: ${errorCode ?? 'unknown_error'} (status ${response.status})`)
    throw new LoyverseApiError('Failed to obtain a token from Loyverse', response.status)
  }

  return data
}

export function exchangeCodeForToken(code: string): Promise<LoyverseTokenResponse> {
  const { LOYVERSE_CLIENT_ID, LOYVERSE_CLIENT_SECRET, LOYVERSE_REDIRECT_URI } = getLoyverseEnv()

  return requestToken(
    new URLSearchParams({
      client_id: LOYVERSE_CLIENT_ID,
      client_secret: LOYVERSE_CLIENT_SECRET,
      redirect_uri: LOYVERSE_REDIRECT_URI,
      code,
      grant_type: 'authorization_code',
    }),
  )
}

export function refreshAccessToken(refreshToken: string): Promise<LoyverseTokenResponse> {
  const { LOYVERSE_CLIENT_ID, LOYVERSE_CLIENT_SECRET } = getLoyverseEnv()

  return requestToken(
    new URLSearchParams({
      client_id: LOYVERSE_CLIENT_ID,
      client_secret: LOYVERSE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  )
}

export interface LoyverseStore {
  id: string
  name: string
}

/**
 * Fetches the list of stores visible to the connected merchant.
 * Loyverse list endpoints conventionally wrap results in an object keyed
 * by the resource name (e.g. `{ "stores": [...] }`) — parsed defensively
 * here since this could not be re-verified against the live (JS-rendered)
 * developer dashboard from this environment. Recommend spot-checking one
 * real response against your Loyverse app before relying on this in
 * production.
 */
export async function fetchStores(accessToken: string): Promise<LoyverseStore[]> {
  const response = await fetch(LOYVERSE_STORES_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  })

  if (!response.ok) {
    console.error(`Loyverse stores request failed: status ${response.status}`)
    throw new LoyverseApiError('Failed to fetch stores from Loyverse', response.status)
  }

  const data = (await response.json()) as unknown

  const rawList = Array.isArray(data)
    ? data
    : Array.isArray((data as { stores?: unknown })?.stores)
      ? (data as { stores: unknown[] }).stores
      : null

  if (!rawList) {
    throw new LoyverseApiError('Unexpected response shape from Loyverse stores endpoint', 502)
  }

  return rawList
    .filter((item): item is { id: string; name: string } => {
      const candidate = item as { id?: unknown; name?: unknown }
      return typeof candidate?.id === 'string' && typeof candidate?.name === 'string'
    })
    .map((store) => ({ id: store.id, name: store.name }))
}
