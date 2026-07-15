'use client'

import { useState, useTransition } from 'react'
import {
  Link2,
  CheckCircle2,
  Database,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  Unlink,
} from 'lucide-react'
import { selectLoyverseStore, disconnectLoyverse } from '@/app/actions/loyverse.actions'

type ConnectionStatus = 'PENDING_STORE_SELECTION' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR'

type LoyverseIntegrationCardProps = {
  branchId: string
  canManage: boolean
  connection: {
    status: ConnectionStatus
    storeId: string | null
    storeName: string | null
    lastError: string | null
    updatedAt: string
  } | null
  availableStores: { id: string; name: string }[]
  oauthResult: { status: string; error?: string } | null
}

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_state: 'The connection request expired or could not be verified. Please try again.',
  missing_code: 'Loyverse did not return an authorization code. Please try again.',
  forbidden: 'You no longer have access to this branch.',
  not_configured: 'Loyverse integration is not configured on this server.',
  no_stores_found: 'No stores were found on this Loyverse account.',
  provider_error: 'Loyverse rejected the request. Please try again.',
  unknown: 'Something went wrong connecting to Loyverse.',
}

export default function LoyverseIntegrationCard({
  branchId,
  canManage,
  connection,
  availableStores,
  oauthResult,
}: LoyverseIntegrationCardProps) {
  const [isPending, startTransition] = useTransition()
  const [selectedStoreId, setSelectedStoreId] = useState<string>('')
  const [formError, setFormError] = useState<string | null>(null)

  const status = connection?.status ?? null
  const connectHref = `/api/integrations/loyverse/connect?branchId=${branchId}`

  function handleSelectStore(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const store = availableStores.find((s) => s.id === selectedStoreId)
    if (!store) {
      setFormError('Please select a store')
      return
    }

    const formData = new FormData()
    formData.set('branchId', branchId)
    formData.set('storeId', store.id)
    formData.set('storeName', store.name)

    startTransition(async () => {
      const result = await selectLoyverseStore(formData)
      if (!result.success) {
        setFormError(result.error ?? 'Failed to link the selected store')
        return
      }
      window.location.reload()
    })
  }

  function handleDisconnect() {
    setFormError(null)
    startTransition(async () => {
      const result = await disconnectLoyverse(branchId)
      if (!result.success) {
        setFormError(result.error ?? 'Failed to disconnect')
        return
      }
      window.location.reload()
    })
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      {oauthResult?.status === 'connected' && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 size={18} />
          Loyverse authorization completed successfully.
        </div>
      )}
      {oauthResult?.status === 'failed' && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle size={18} />
          {OAUTH_ERROR_MESSAGES[oauthResult.error ?? 'unknown'] ?? OAUTH_ERROR_MESSAGES.unknown}
        </div>
      )}

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <Database size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">Loyverse POS</h3>
              {status === 'CONNECTED' && (
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  Connected{connection?.storeName ? ` · ${connection.storeName}` : ''}
                </span>
              )}
              {status === 'PENDING_STORE_SELECTION' && (
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                  Select a store
                </span>
              )}
              {status === 'ERROR' && (
                <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                  Connection error
                </span>
              )}
              {(status === 'DISCONNECTED' || !status) && (
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                  Not connected
                </span>
              )}
            </div>
            <p className="mt-1 max-w-xl text-sm text-gray-500">
              Connect Loyverse to import receipts, stores, POS devices, employees, payment types
              and shifts for this branch.
            </p>
            {status === 'ERROR' && connection?.lastError && (
              <p className="mt-1 text-xs text-red-600">{connection.lastError}</p>
            )}
            <a
              href="https://loyverse.com"
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700"
            >
              Visit Loyverse
              <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {canManage && status !== 'PENDING_STORE_SELECTION' && (
          <div className="flex shrink-0 gap-2">
            <a
              href={connectHref}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
            >
              {status === 'CONNECTED' ? (
                <>
                  <RefreshCw size={16} />
                  Reconnect
                </>
              ) : (
                <>
                  <Link2 size={16} />
                  Connect Loyverse
                </>
              )}
            </a>
            {status === 'CONNECTED' && (
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={isPending}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-60"
              >
                <Unlink size={16} />
                Disconnect
              </button>
            )}
          </div>
        )}
      </div>

      {status === 'PENDING_STORE_SELECTION' && canManage && (
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="mb-3 text-sm font-medium text-amber-900">
            This Loyverse account has multiple stores. Choose the one that matches this branch.
          </p>
          {availableStores.length === 0 ? (
            <p className="text-sm text-amber-700">
              Couldn&apos;t load the store list — try reconnecting.
            </p>
          ) : (
            <form onSubmit={handleSelectStore} className="space-y-3">
              <div className="space-y-2">
                {availableStores.map((store) => (
                  <label
                    key={store.id}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                  >
                    <input
                      type="radio"
                      name="storeId"
                      value={store.id}
                      checked={selectedStoreId === store.id}
                      onChange={() => setSelectedStoreId(store.id)}
                    />
                    {store.name}
                  </label>
                ))}
              </div>
              <button
                type="submit"
                disabled={isPending || !selectedStoreId}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                Link store
              </button>
            </form>
          )}
        </div>
      )}

      {formError && <p className="mt-3 text-sm text-red-600">{formError}</p>}
    </div>
  )
}
