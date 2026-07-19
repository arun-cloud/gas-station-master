import 'server-only'
import cron from 'node-cron'
import { syncAllConnectedBranches } from './sync'

// Default: every 5 minutes. Configurable so this can be tuned per
// deployment without a code change — set LOYVERSE_SYNC_CRON to any valid
// cron expression (e.g. "*/15 * * * *" for 15 minutes).
const DEFAULT_CRON_EXPRESSION = '*/5 * * * *'

let started = false

/**
 * Starts the in-process receipt-sync scheduler exactly once per server
 * process. Intended to run inside a long-lived Node process (this app's
 * Docker deployment), not a serverless/edge runtime — see
 * src/instrumentation.ts for where this is called from.
 */
export function startLoyverseSyncScheduler(): void {
  if (started) return
  started = true

  const expression = process.env.LOYVERSE_SYNC_CRON || DEFAULT_CRON_EXPRESSION

  if (!cron.validate(expression)) {
    console.error(
      `[Loyverse] Invalid LOYVERSE_SYNC_CRON expression "${expression}" — scheduler not started`,
    )
    started = false
    return
  }

  cron.schedule(expression, async () => {
    try {
      const summaries = await syncAllConnectedBranches()
      const totalCreated = summaries.reduce((sum, s) => sum + s.created, 0)
      const totalFailed = summaries.reduce((sum, s) => sum + s.failed, 0)
      if (totalCreated > 0 || totalFailed > 0) {
        console.log('[Loyverse] Scheduled sync complete', {
          branches: summaries.length,
          created: totalCreated,
          failed: totalFailed,
        })
      }
    } catch (error) {
      console.error('[Loyverse] Scheduled sync run threw unexpectedly:', error)
    }
  })

  console.log(`[Loyverse] Receipt sync scheduler started (${expression})`)
}
