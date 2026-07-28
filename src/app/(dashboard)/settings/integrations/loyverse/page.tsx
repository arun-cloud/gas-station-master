import { Building2 } from 'lucide-react'
import LoyverseIntegrationCard from '@/components/settings/LoyverseIntegrationCard'
import { resolveActiveBranch } from '@/lib/branch-context'
import { fetchStores, type LoyverseStore } from '@/lib/integrations/loyverse/client'
import { decryptToken } from '@/lib/integrations/loyverse/crypto'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/rbac'

type LoyverseSettingsPageProps = {
  searchParams: Promise<{
    loyverse?: string
    error?: string
    branchId?: string
  }>
}

async function getPendingAccessToken(branchId: string): Promise<string | null> {
  const connection = await prisma.loyverseConnection.findUnique({ where: { branchId } })
  if (!connection || connection.status !== 'PENDING_STORE_SELECTION') return null

  try {
    return decryptToken(connection.accessTokenEncrypted)
  } catch {
    return null
  }
}

export default async function LoyverseSettingsPage({
  searchParams,
}: LoyverseSettingsPageProps) {
  const params = await searchParams
  const user = await requireUser()
  const { activeBranch } = await resolveActiveBranch()

  if (!activeBranch) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <Building2 size={24} className="mb-2 text-amber-600" />
        <h1 className="text-lg font-semibold text-amber-900">No branch access</h1>
        <p className="mt-1 text-sm text-amber-700">
          You don&apos;t have access to any active branch yet. Contact an administrator to be
          assigned to a branch.
        </p>
      </div>
    )
  }

  const connection = await prisma.loyverseConnection.findUnique({
    where: { branchId: activeBranch.id },
  })

  let availableStores: LoyverseStore[] = []
  if (connection?.status === 'PENDING_STORE_SELECTION') {
    const accessToken = await getPendingAccessToken(activeBranch.id)
    if (accessToken) {
      try {
        availableStores = await fetchStores(accessToken)
      } catch {
        availableStores = []
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Loyverse POS</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure the integration for {activeBranch.nameEn} ({activeBranch.branchCode}).
        </p>
      </div>
      <LoyverseIntegrationCard
        branchId={activeBranch.id}
        canManage={user.role === 'ADMIN' || user.role === 'MANAGER'}
        connection={
          connection
            ? {
                status: connection.status,
                storeId: connection.storeId,
                storeName: connection.storeName,
                lastError: connection.lastError,
                updatedAt: connection.updatedAt.toISOString(),
              }
            : null
        }
        availableStores={availableStores}
        oauthResult={params.loyverse ? { status: params.loyverse, error: params.error } : null}
      />
    </div>
  )
}
