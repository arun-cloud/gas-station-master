import 'server-only'
import { prisma } from '@/lib/prisma'
import { encryptToken, decryptToken } from './crypto'
import { refreshAccessToken, type LoyverseTokenResponse } from './client'
import type { LoyverseConnectionStatus } from '../../../../prisma/generated/client'

// Refresh a bit before actual expiry to absorb clock skew and request
// latency — never let an in-flight request race a token that expires
// mid-call.
const REFRESH_SKEW_MS = 60_000

function expiresAtFromNow(expiresInSeconds: number): Date {
  return new Date(Date.now() + expiresInSeconds * 1000)
}

export async function upsertConnectionFromTokenResponse(params: {
  branchId: string
  tokens: LoyverseTokenResponse
  actorId: string
  status: LoyverseConnectionStatus
  storeId?: string
  storeName?: string
}) {
  const { branchId, tokens, actorId, status, storeId, storeName } = params

  return prisma.loyverseConnection.upsert({
    where: { branchId },
    create: {
      branchId,
      status,
      storeId: storeId ?? null,
      storeName: storeName ?? null,
      accessTokenEncrypted: encryptToken(tokens.access_token),
      refreshTokenEncrypted: encryptToken(tokens.refresh_token),
      tokenType: tokens.token_type ?? 'Bearer',
      scope: tokens.scope,
      expiresAt: expiresAtFromNow(tokens.expires_in),
      lastRefreshedAt: new Date(),
      createdBy: actorId,
      updatedBy: actorId,
    },
    update: {
      status,
      storeId: storeId ?? undefined,
      storeName: storeName ?? undefined,
      accessTokenEncrypted: encryptToken(tokens.access_token),
      refreshTokenEncrypted: encryptToken(tokens.refresh_token),
      tokenType: tokens.token_type ?? 'Bearer',
      scope: tokens.scope,
      expiresAt: expiresAtFromNow(tokens.expires_in),
      lastRefreshedAt: new Date(),
      lastError: null,
      updatedBy: actorId,
    },
  })
}

/**
 * Returns a valid (non-expired) Loyverse access token for the given branch,
 * transparently refreshing it if it's expired or about to expire. Intended
 * for server-side use only (Phase 3B sync jobs / API calls) — the token
 * itself must never be sent to the browser.
 *
 * Returns null if the branch has no CONNECTED Loyverse integration.
 */
export async function getValidLoyverseAccessToken(branchId: string): Promise<string | null> {
  const connection = await prisma.loyverseConnection.findUnique({ where: { branchId } })

  if (!connection || connection.status !== 'CONNECTED') {
    return null
  }

  const needsRefresh = connection.expiresAt.getTime() - REFRESH_SKEW_MS <= Date.now()

  if (!needsRefresh) {
    return decryptToken(connection.accessTokenEncrypted)
  }

  try {
    const refreshToken = decryptToken(connection.refreshTokenEncrypted)
    const tokens = await refreshAccessToken(refreshToken)

    const updated = await prisma.loyverseConnection.update({
      where: { branchId },
      data: {
        accessTokenEncrypted: encryptToken(tokens.access_token),
        // Loyverse may or may not rotate the refresh token on use — if a
        // new one isn't returned, keep the existing (still-valid) one.
        refreshTokenEncrypted: tokens.refresh_token
          ? encryptToken(tokens.refresh_token)
          : connection.refreshTokenEncrypted,
        tokenType: tokens.token_type ?? connection.tokenType,
        scope: tokens.scope ?? connection.scope,
        expiresAt: expiresAtFromNow(tokens.expires_in),
        lastRefreshedAt: new Date(),
        lastError: null,
      },
    })

    return decryptToken(updated.accessTokenEncrypted)
  } catch (error) {
    console.error(`Loyverse token refresh failed for branch ${branchId}:`, error)
    await prisma.loyverseConnection.update({
      where: { branchId },
      data: { status: 'ERROR', lastError: 'Token refresh failed — reconnect required' },
    })
    return null
  }
}
