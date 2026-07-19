'use server'

import { revalidatePath } from 'next/cache'
import { resolveActiveBranch } from '@/lib/branch-context'
import { ForbiddenError, requireRole } from '@/lib/rbac'
import { syncReceiptsForBranch, type SyncSummary } from '@/lib/integrations/loyverse/sync'

export type TriggerSyncResult =
  | { success: true; summary: SyncSummary }
  | { success: false; error: string }

/**
 * Manual "Sync Now" action. ADMIN/MANAGER only — mirrors the RBAC
 * convention used across every other mutating action in this app.
 * Read queries live in src/lib/services/invoice-service.ts, not here —
 * this file is reserved for mutations, per the "actions vs services"
 * separation used throughout the app.
 */
export async function triggerManualSync(): Promise<TriggerSyncResult> {
  try {
    const actor = await requireRole(['ADMIN', 'MANAGER'])
    const { activeBranch } = await resolveActiveBranch()

    if (!activeBranch) {
      return { success: false, error: 'No active branch selected' }
    }

    const summary = await syncReceiptsForBranch(activeBranch.id, actor.id)

    if (summary.error) {
      return { success: false, error: summary.error }
    }

    revalidatePath('/invoices')
    return { success: true, summary }
  } catch (error: unknown) {
    if (error instanceof ForbiddenError) {
      return { success: false, error: error.message }
    }
    console.error('Manual Loyverse sync failed:', error)
    return { success: false, error: 'Failed to sync invoices from Loyverse' }
  }
}
