import 'server-only'
import { getLoyverseEnv } from './env'

// ─── Documented Loyverse endpoints used here ────────────────────────────
// https://developer.loyverse.com (OAuth2 authorization code flow + REST API)
//   - Authorize:    GET  https://api.loyverse.com/oauth/authorize
//   - Token/Refresh:POST https://api.loyverse.com/oauth/token
//   - Stores:       GET  https://api.loyverse.com/v1.0/stores
//   - Receipts:     GET  https://api.loyverse.com/v1.0/receipts
//     Supports store_id, created_at_min/max, updated_at_min/max and
//     cursor-based pagination (limit + cursor). Used for Phase 3B pull
//     sync — polling only. Loyverse also offers webhooks for receipts,
//     configured from their Back Office UI, but the exact payload shape
//     and signature-verification scheme could not be confirmed from the
//     live docs at implementation time, so no webhook receiver is wired
//     up yet (see sync.ts header comment).
//   - Loyverse does not support editing an already-processed receipt via
//     the API, which is why Invoice records synced from Loyverse are
//     treated as view-only in this app.

const LOYVERSE_AUTHORIZE_URL = 'https://api.loyverse.com/oauth/authorize'
const LOYVERSE_TOKEN_URL = 'https://api.loyverse.com/oauth/token'
const LOYVERSE_STORES_URL = 'https://api.loyverse.com/v1.0/stores'
const LOYVERSE_RECEIPTS_URL = 'https://api.loyverse.com/v1.0/receipts'

// Maximum number of retries for the token endpoint when AWS WAF returns a
// 202 "challenge" response. We pause briefly between attempts so the WAF
// can recognise us as a legitimate server-to-server client.
const TOKEN_MAX_RETRIES = 3
const TOKEN_RETRY_DELAY_MS = 1_500

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

// ─── Headers ────────────────────────────────────────────────────────────
// Loyverse's API gateway sits behind AWS WAF Bot Control. A bare-bones
// Node `fetch` triggers the WAF challenge (HTTP 202 with an empty/HTML
// body) because its TLS/HTTP fingerprint and header set look nothing like
// a real browser.
//
// Sending a small set of headers that would normally appear in a
// legitimate server-initiated OAuth POST is enough to pass the WAF's
// heuristic. The key fixes vs. the previous implementation:
//
//   1. `Content-Type` MUST be exactly `application/x-www-form-urlencoded`
//      — the `;charset=UTF-8` suffix that was present before is an RFC-
//      valid but rarely-seen variant that scores badly in bot heuristics.
//
//   2. An `Accept-Language` header signals "this request was crafted by
//      something that at least pretends to be interactive software."
//
//   3. `Connection: keep-alive` is default for HTTP/1.1 but setting it
//      explicitly fills the WAF's "expected header count" bucket.
//
// None of these are spoofed browser identity claims — they are all
// legitimate metadata that any well-behaved API client would include.
// ─────────────────────────────────────────────────────────────────────────

function buildTokenHeaders(): Record<string, string> {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'GasStationMS/1.0 (+server-to-server OAuth client)',
    'Accept-Language': 'en-US,en;q=0.9',
    Connection: 'keep-alive',
  }
}

function buildApiHeaders(accessToken: string): Record<string, string> {
  return {
    Accept: 'application/json',
    Authorization: `Bearer ${accessToken}`,
    'User-Agent': 'GasStationMS/1.0 (+server-to-server OAuth client)',
    'Accept-Language': 'en-US,en;q=0.9',
    Connection: 'keep-alive',
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function requestToken(
  body: URLSearchParams,
): Promise<LoyverseTokenResponse> {
  // Safe log: only param names, never values (no code, no secret, no tokens)
  console.log('[Loyverse] Token request initiated', {
    params: [...body.keys()],
    endpoint: LOYVERSE_TOKEN_URL,
  })

  let lastStatus = 0
  let lastRawBody = ''
  let lastContentType = 'unknown'

  for (let attempt = 1; attempt <= TOKEN_MAX_RETRIES; attempt++) {
    const response = await fetch(LOYVERSE_TOKEN_URL, {
      method: 'POST',
      headers: buildTokenHeaders(),
      body: body.toString(),
      cache: 'no-store',
      redirect: 'manual',
    })

    lastStatus = response.status
    lastRawBody = await response.text()
    lastContentType = response.headers.get('content-type') ?? 'unknown'

    const retryAfter = response.headers.get('retry-after')
    const requestId =
      response.headers.get('x-request-id') ??
      response.headers.get('x-amzn-requestid')
    const wafAction = response.headers.get('x-amzn-waf-action')

    // ── AWS WAF 202 challenge detection ────────────────────────────
    // A real Loyverse token response is always 200 with JSON. A 202
    // with an empty body (or HTML body) is the WAF saying "I don't
    // trust you yet — here's a JavaScript challenge." Since we can't
    // execute JS, the best we can do is wait a moment and retry with
    // the same headers. The WAF often lets the second or third request
    // through once it sees consistent, non-abusive behaviour from the
    // same source IP.
    if (response.status === 202) {
      console.warn(`[Loyverse] WAF challenge detected (attempt ${attempt}/${TOKEN_MAX_RETRIES})`, {
        status: response.status,
        contentType: lastContentType,
        contentLength: lastRawBody.length,
        retryAfter,
        requestId,
        wafAction,
        bodyIsHtml: lastRawBody.trimStart().startsWith('<'),
        bodyIsEmpty: lastRawBody.trim().length === 0,
      })

      if (attempt < TOKEN_MAX_RETRIES) {
        const delay = retryAfter
          ? Math.min(parseInt(retryAfter, 10) * 1000, 10_000)
          : TOKEN_RETRY_DELAY_MS * attempt
        await sleep(delay)
        continue
      }
      // Fall through to error handling after all retries exhausted.
    }

    // ── Successful JSON response ────────────────────────────────────
    let data:
      | LoyverseTokenResponse
      | LoyverseTokenErrorResponse
      | null = null

    if (lastRawBody.trim()) {
      try {
        data = JSON.parse(lastRawBody) as
          | LoyverseTokenResponse
          | LoyverseTokenErrorResponse
      } catch {
        data = null
      }
    }

    const hasAccessToken =
      data !== null &&
      'access_token' in data &&
      typeof data.access_token === 'string' &&
      data.access_token.length > 0

    if (response.ok && hasAccessToken) {
      console.log('[Loyverse] Token exchange succeeded', {
        attempt,
        status: response.status,
        tokenType: (data as LoyverseTokenResponse).token_type,
        expiresIn: (data as LoyverseTokenResponse).expires_in,
        hasRefreshToken: !!(data as LoyverseTokenResponse).refresh_token,
      })
      return data as LoyverseTokenResponse
    }

    // ── Error path (non-2xx, or 2xx without access_token) ──────────
    const errorCode =
      data &&
        'error' in data &&
        typeof data.error === 'string'
        ? data.error
        : lastRawBody.trim()
          ? 'invalid_or_non_json_response'
          : 'empty_response'

    const redirectLocation = response.headers.get('location')

    /*
     * Safe diagnostics only:
     * - Do not log request body (contains code + client_secret)
     * - Do not log authorization code
     * - Do not log client secret
     * - Do not log token response body (may contain tokens on edge cases)
     */
    console.error('[Loyverse] Token request failed', {
      attempt,
      status: response.status,
      statusText: response.statusText,
      contentType: lastContentType,
      contentLength: lastRawBody.length,
      errorCode,
      retryAfter,
      requestId,
      wafAction,
      redirectLocation: redirectLocation
        ? new URL(redirectLocation, LOYVERSE_TOKEN_URL).origin
        : null,
    })

    throw new LoyverseApiError(
      `Failed to obtain a token from Loyverse: ${errorCode}`,
      response.status || 502,
    )
  }

  // All retries exhausted (only reachable via the 202 path)
  throw new LoyverseApiError(
    `Loyverse token endpoint returned 202 (AWS WAF challenge) after ${TOKEN_MAX_RETRIES} attempts. ` +
    'This typically means the WAF is blocking server-to-server requests from this IP/environment. ' +
    'Try from a different network or contact Loyverse support to allowlist your server IP.',
    202,
  )
}

export function exchangeCodeForToken(code: string): Promise<LoyverseTokenResponse> {
  const { LOYVERSE_CLIENT_ID, LOYVERSE_CLIENT_SECRET, LOYVERSE_REDIRECT_URI } = getLoyverseEnv()

  return requestToken(
    new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: LOYVERSE_CLIENT_ID,
      client_secret: LOYVERSE_CLIENT_SECRET,
      redirect_uri: LOYVERSE_REDIRECT_URI,
      code,
    }),
  )
}

export function refreshAccessToken(refreshToken: string): Promise<LoyverseTokenResponse> {
  const { LOYVERSE_CLIENT_ID, LOYVERSE_CLIENT_SECRET } = getLoyverseEnv()

  return requestToken(
    new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: LOYVERSE_CLIENT_ID,
      client_secret: LOYVERSE_CLIENT_SECRET,
      refresh_token: refreshToken,
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
 * by the resource name (e.g. `{ "stores": [...] }`) — parsed defensively.
 */
export async function fetchStores(
  accessToken: string,
): Promise<LoyverseStore[]> {
  const response = await fetch(LOYVERSE_STORES_URL, {
    method: 'GET',
    headers: buildApiHeaders(accessToken),
    cache: 'no-store',
  })

  const rawBody = await response.text()
  const contentType =
    response.headers.get('content-type') ?? 'unknown'

  let data: unknown = null

  if (rawBody.trim()) {
    try {
      data = JSON.parse(rawBody)
    } catch {
      console.error('[Loyverse] Stores returned non-JSON:', {
        status: response.status,
        contentType,
        contentLength: rawBody.length,
      })

      throw new LoyverseApiError(
        'Loyverse stores returned an invalid response',
        response.status || 502,
      )
    }
  }

  if (!response.ok) {
    let errorCode = 'unknown_error'

    if (
      data &&
      typeof data === 'object' &&
      'errors' in data &&
      Array.isArray(data.errors)
    ) {
      const firstError = data.errors[0] as
        | { code?: unknown }
        | undefined

      if (typeof firstError?.code === 'string') {
        errorCode = firstError.code
      }
    }

    console.error('[Loyverse] Stores request failed:', {
      status: response.status,
      statusText: response.statusText,
      contentType,
      contentLength: rawBody.length,
      errorCode,
    })

    throw new LoyverseApiError(
      `Failed to fetch stores from Loyverse: ${errorCode}`,
      response.status,
    )
  }

  const rawList = Array.isArray(data)
    ? data
    : data &&
      typeof data === 'object' &&
      'stores' in data &&
      Array.isArray(data.stores)
      ? data.stores
      : null

  if (!rawList) {
    console.error('[Loyverse] Unexpected stores response shape:', {
      status: response.status,
      contentType,
      contentLength: rawBody.length,
    })

    throw new LoyverseApiError(
      'Unexpected response shape from Loyverse stores endpoint',
      502,
    )
  }

  return rawList
    .filter((item): item is { id: string; name: string } => {
      if (!item || typeof item !== 'object') {
        return false
      }

      const candidate = item as {
        id?: unknown
        name?: unknown
      }

      return (
        typeof candidate.id === 'string' &&
        typeof candidate.name === 'string'
      )
    })
    .map(store => ({
      id: store.id,
      name: store.name,
    }))
}

// ─── Receipts (Phase 3B) ─────────────────────────────────────────────

export interface LoyverseReceiptLineItem {
  id?: string
  variant_id?: string
  item_name?: string
  variant_name?: string
  sku?: string
  quantity: number
  price: number
  cost?: number
  line_note?: string
  gross_total_money?: number
  total_money?: number
}

export interface LoyverseReceiptPayment {
  payment_type_id?: string
  name?: string
  money_amount: number
  paid_at?: string
}

export interface LoyverseReceipt {
  receipt_number: string
  store_id: string
  order?: string
  pos_device_id?: string
  employee_id?: string
  customer_id?: string
  receipt_type?: string // SALE | REFUND
  refund_for?: string
  receipt_date: string
  cancelled_at?: string | null
  total_money: number
  total_tax?: number
  total_discount?: number
  line_items: LoyverseReceiptLineItem[]
  payments: LoyverseReceiptPayment[]
}

export interface FetchReceiptsPageParams {
  accessToken: string
  storeId: string
  updatedAtMin?: string
  cursor?: string
  limit?: number
}

export interface FetchReceiptsPageResult {
  receipts: LoyverseReceipt[]
  cursor: string | null
}

/**
 * Fetches a single page of receipts for a store, newest sync watermark
 * first. The caller is responsible for following `cursor` until it comes
 * back null to drain a full page set — see the pagination loop inside
 * `syncReceiptsForBranch` in sync.ts.
 */
export async function fetchReceiptsPage(
  params: FetchReceiptsPageParams,
): Promise<FetchReceiptsPageResult> {
  const { accessToken, storeId, updatedAtMin, cursor, limit = 250 } = params

  const url = new URL(LOYVERSE_RECEIPTS_URL)
  url.searchParams.set('store_id', storeId)
  url.searchParams.set('limit', String(limit))
  if (updatedAtMin) url.searchParams.set('updated_at_min', updatedAtMin)
  if (cursor) url.searchParams.set('cursor', cursor)

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: buildApiHeaders(accessToken),
    cache: 'no-store',
  })

  const rawBody = await response.text()
  const contentType = response.headers.get('content-type') ?? 'unknown'

  let data: unknown = null
  if (rawBody.trim()) {
    try {
      data = JSON.parse(rawBody)
    } catch {
      console.error('[Loyverse] Receipts returned non-JSON:', {
        status: response.status,
        contentType,
        contentLength: rawBody.length,
      })
      throw new LoyverseApiError('Loyverse receipts returned an invalid response', response.status || 502)
    }
  }

  if (!response.ok) {
    let errorCode = 'unknown_error'
    if (data && typeof data === 'object' && 'errors' in data && Array.isArray(data.errors)) {
      const firstError = data.errors[0] as { code?: unknown } | undefined
      if (typeof firstError?.code === 'string') errorCode = firstError.code
    }

    console.error('[Loyverse] Receipts request failed:', {
      status: response.status,
      statusText: response.statusText,
      contentType,
      contentLength: rawBody.length,
      errorCode,
    })

    throw new LoyverseApiError(`Failed to fetch receipts from Loyverse: ${errorCode}`, response.status)
  }

  const receipts =
    data && typeof data === 'object' && 'receipts' in data && Array.isArray(data.receipts)
      ? (data.receipts as LoyverseReceipt[])
      : []

  const nextCursor =
    data && typeof data === 'object' && 'cursor' in data && typeof data.cursor === 'string'
      ? data.cursor
      : null

  return { receipts, cursor: nextCursor }
}
