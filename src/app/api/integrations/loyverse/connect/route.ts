import { NextRequest, NextResponse } from 'next/server'
import { requireRole, requireBranchAccess, ForbiddenError } from '@/lib/rbac'
import { buildLoyverseAuthorizeUrl } from '@/lib/integrations/loyverse/client'
import { createOAuthState } from '@/lib/integrations/loyverse/oauth-state'
import { LoyverseConfigError } from '@/lib/integrations/loyverse/env'

// Not covered by middleware.ts (only page routes are), so auth + RBAC are
// enforced explicitly here, exactly as every Server Action in this app does.
export async function GET(request: NextRequest) {
  try {
    await requireRole(['ADMIN', 'MANAGER'])

    const branchId = request.nextUrl.searchParams.get('branchId')
    if (!branchId) {
      return NextResponse.json({ error: 'branchId is required' }, { status: 400 })
    }

    await requireBranchAccess(branchId)

    const { state } = await createOAuthState(branchId)
    const authorizeUrl = buildLoyverseAuthorizeUrl(state)

    return NextResponse.redirect(authorizeUrl)
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    if (error instanceof LoyverseConfigError) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    console.error('Loyverse connect route failed:', error)
    return NextResponse.json({ error: 'Failed to start Loyverse connection' }, { status: 500 })
  }
}
