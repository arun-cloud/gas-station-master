import { NextRequest, NextResponse } from 'next/server'
import { requireBranchAccess, requireUserOrThrow, ForbiddenError } from '@/lib/rbac'
import { exchangeCodeForToken, fetchStores, LoyverseApiError } from '@/lib/integrations/loyverse/client'
import { compareAndConsumeState } from '@/lib/integrations/loyverse/oauth-state'
import { upsertConnectionFromTokenResponse } from '@/lib/integrations/loyverse/connection'
import { LoyverseConfigError } from '@/lib/integrations/loyverse/env'

function redirectToSettings(request: NextRequest, params: Record<string, string>) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || request.nextUrl.origin
  const url = new URL('/settings', appUrl)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  return NextResponse.redirect(url)
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const returnedState = request.nextUrl.searchParams.get('state')
  const providerError = request.nextUrl.searchParams.get('error')

  if (providerError) {
    return redirectToSettings(request, { loyverse: 'failed', error: providerError })
  }

  const { valid, branchId } = await compareAndConsumeState(returnedState)

  if (!valid || !branchId) {
    return redirectToSettings(request, { loyverse: 'failed', error: 'invalid_state' })
  }

  if (!code) {
    return redirectToSettings(request, { loyverse: 'failed', error: 'missing_code', branchId })
  }

  try {
    // Defense in depth: the state cookie already proves this browser started
    // the flow, but re-check the signed-in user still has access to this
    // branch before writing anything.
    const actor = await requireUserOrThrow()
    await requireBranchAccess(branchId)

    // const tokens = await exchangeCodeForToken(code)
    // const stores = await fetchStores(tokens.access_token)

    let tokens

    try {
      tokens = await exchangeCodeForToken(code)
    } catch (error) {
      if (error instanceof LoyverseApiError) {
        console.error('Loyverse token exchange failed:', {
          status: error.status,
          message: error.message,
        })

        return redirectToSettings(request, {
          loyverse: 'failed',
          error: 'token_exchange_failed',
          status: String(error.status),
          branchId,
        })
      }

      throw error
    }

    let stores

    try {
      stores = await fetchStores(tokens.access_token)
    } catch (error) {
      if (error instanceof LoyverseApiError) {
        console.error('Loyverse stores fetch failed:', {
          status: error.status,
          message: error.message,
        })

        return redirectToSettings(request, {
          loyverse: 'failed',
          error: 'stores_fetch_failed',
          status: String(error.status),
          branchId,
        })
      }

      throw error
    }

    if (stores.length === 0) {
      await upsertConnectionFromTokenResponse({
        branchId,
        tokens,
        actorId: actor.id,
        status: 'ERROR',
      })
      return redirectToSettings(request, { loyverse: 'failed', error: 'no_stores_found', branchId })
    }

    if (stores.length === 1) {
      await upsertConnectionFromTokenResponse({
        branchId,
        tokens,
        actorId: actor.id,
        status: 'CONNECTED',
        storeId: stores[0].id,
        storeName: stores[0].name,
      })
      return redirectToSettings(request, { loyverse: 'connected', branchId })
    }

    // Multiple stores visible to this merchant — persist the tokens now,
    // but require an explicit choice before treating the connection as live.
    await upsertConnectionFromTokenResponse({
      branchId,
      tokens,
      actorId: actor.id,
      status: 'PENDING_STORE_SELECTION',
    })
    return redirectToSettings(request, { loyverse: 'select-store', branchId })
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return redirectToSettings(request, { loyverse: 'failed', error: 'forbidden', branchId })
    }
    if (error instanceof LoyverseConfigError) {
      return redirectToSettings(request, { loyverse: 'failed', error: 'not_configured', branchId })
    }
    if (error instanceof LoyverseApiError) {
      console.error('Loyverse callback API error:', error.message, error.status)
      return redirectToSettings(request, { loyverse: 'failed', error: 'provider_error', branchId })
    }
    console.error('Loyverse callback failed:', error)
    return redirectToSettings(request, { loyverse: 'failed', error: 'unknown', branchId })
  }
}
