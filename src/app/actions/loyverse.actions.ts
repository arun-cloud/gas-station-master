'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireRole, requireBranchAccess, ForbiddenError } from '@/lib/rbac'
import {
  selectLoyverseStoreSchema,
  firstZodMessage,
} from '@/lib/validation/loyverse.schema'

export type LoyverseActionResult = {
  success: boolean
  error?: string
}

function readSelectStoreFormData(formData: FormData) {
  return {
    branchId: formData.get('branchId'),
    storeId: formData.get('storeId'),
    storeName: formData.get('storeName'),
  }
}

// ── Finalize which Loyverse store maps to this branch ──
// Used when a merchant has more than one store visible after OAuth — the
// tokens are already persisted (PENDING_STORE_SELECTION); this just confirms
// the mapping and flips the connection to CONNECTED.
export async function selectLoyverseStore(formData: FormData): Promise<LoyverseActionResult> {
  try {
    const actor = await requireRole(['ADMIN', 'MANAGER'])

    const parsed = selectLoyverseStoreSchema.safeParse(readSelectStoreFormData(formData))
    if (!parsed.success) {
      return { success: false, error: firstZodMessage(parsed.error) }
    }
    const data = parsed.data

    await requireBranchAccess(data.branchId)

    const connection = await prisma.loyverseConnection.findUnique({
      where: { branchId: data.branchId },
    })

    if (!connection || connection.status !== 'PENDING_STORE_SELECTION') {
      return { success: false, error: 'No pending Loyverse connection found for this branch' }
    }

    // A store must map to exactly one branch — the DB-level unique
    // constraint on storeId is the real guarantee; this check just gives a
    // friendlier error message before hitting it.
    const storeTaken = await prisma.loyverseConnection.findFirst({
      where: { storeId: data.storeId, branchId: { not: data.branchId } },
      select: { branchId: true },
    })
    if (storeTaken) {
      return { success: false, error: 'This Loyverse store is already linked to another branch' }
    }

    await prisma.loyverseConnection.update({
      where: { branchId: data.branchId },
      data: {
        storeId: data.storeId,
        storeName: data.storeName,
        status: 'CONNECTED',
        updatedBy: actor.id,
      },
    })

    revalidatePath('/settings')
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof ForbiddenError) {
      return { success: false, error: error.message }
    }
    console.error('Failed to finalize Loyverse store selection:', error)
    return { success: false, error: 'Failed to link the selected store' }
  }
}

// ── Disconnect a branch's Loyverse integration ──
// Loyverse does not document a token-revocation endpoint, so this only
// stops the app from using the stored tokens locally — it does not revoke
// merchant-side consent. Tokens are cleared, not just flagged, so a stale
// encrypted token can never be decrypted and reused later.
export async function disconnectLoyverse(branchId: string): Promise<LoyverseActionResult> {
  try {
    const actor = await requireRole(['ADMIN', 'MANAGER'])
    await requireBranchAccess(branchId)

    const connection = await prisma.loyverseConnection.findUnique({ where: { branchId } })
    if (!connection) {
      return { success: false, error: 'No Loyverse connection found for this branch' }
    }

    await prisma.loyverseConnection.update({
      where: { branchId },
      data: {
        status: 'DISCONNECTED',
        accessTokenEncrypted: '',
        refreshTokenEncrypted: '',
        storeId: null,
        storeName: null,
        lastError: null,
        updatedBy: actor.id,
      },
    })

    revalidatePath('/settings')
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof ForbiddenError) {
      return { success: false, error: error.message }
    }
    console.error('Failed to disconnect Loyverse:', error)
    return { success: false, error: 'Failed to disconnect Loyverse' }
  }
}
