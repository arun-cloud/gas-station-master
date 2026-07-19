import { NextRequest, NextResponse } from 'next/server'
import { syncAllConnectedBranches } from '@/lib/integrations/loyverse/sync'

// Not used by the default Docker deployment (which relies on the
// in-process scheduler in src/instrumentation.ts), but kept available
// for hosts that prefer to trigger sync from an external
// cron/orchestrator instead of an always-on Node process.
//
// Protected by a shared secret rather than a user session, since the
// caller here is infrastructure, not a signed-in person.
export async function POST(request: NextRequest) {
  const configuredSecret = process.env.CRON_SECRET

  if (!configuredSecret) {
    return NextResponse.json(
      { success: false, error: 'CRON_SECRET is not configured on this deployment' },
      { status: 503 },
    )
  }

  const providedSecret = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')

  if (!providedSecret || providedSecret !== configuredSecret) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const summaries = await syncAllConnectedBranches('system:cron-http')
    return NextResponse.json({ success: true, summaries })
  } catch (error) {
    console.error('[Loyverse] Cron-triggered sync failed:', error)
    return NextResponse.json({ success: false, error: 'Sync failed' }, { status: 500 })
  }
}
