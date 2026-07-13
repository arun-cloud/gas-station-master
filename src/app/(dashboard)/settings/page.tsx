import Link from 'next/link'
import {
    Link2,
    CheckCircle2,
    Database,
    RefreshCw,
    ExternalLink,
} from 'lucide-react'

type SettingsPageProps = {
    searchParams: Promise<{
        loyverse?: string
        error?: string
    }>
}

export default async function SettingsPage({
    searchParams,
}: SettingsPageProps) {
    const params = await searchParams

    const isConnected = params.loyverse === 'connected'
    const isFailed = params.loyverse === 'failed'

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">
                    Settings
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    Configure integrations and application preferences.
                </p>
            </div>

            {/* OAuth result */}
            {isConnected && (
                <div
                    className="flex items-center gap-3 rounded-lg border
            border-emerald-200 bg-emerald-50 px-4 py-3
            text-sm text-emerald-800"
                >
                    <CheckCircle2 size={18} />

                    Loyverse authorization completed successfully.
                </div>
            )}

            {isFailed && (
                <div
                    className="rounded-lg border border-red-200
            bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                    Loyverse authorization failed
                    {params.error ? `: ${params.error}` : '.'}
                </div>
            )}

            {/* Integrations */}
            <section className="space-y-4">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">
                        Integrations
                    </h2>

                    <p className="text-sm text-gray-500">
                        Connect external services used by the fuel station.
                    </p>
                </div>

                {/* Loyverse card */}
                <div
                    className="rounded-xl border border-gray-200
            bg-white p-6 shadow-sm"
                >
                    <div
                        className="flex flex-col gap-5 sm:flex-row
              sm:items-center sm:justify-between"
                    >
                        <div className="flex items-start gap-4">
                            <div
                                className="flex h-12 w-12 shrink-0 items-center
                  justify-center rounded-xl bg-emerald-100
                  text-emerald-700"
                            >
                                <Database size={24} />
                            </div>

                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-gray-900">
                                        Loyverse POS
                                    </h3>

                                    {isConnected && (
                                        <span
                                            className="rounded-full bg-emerald-100
                        px-2.5 py-1 text-xs font-medium
                        text-emerald-700"
                                        >
                                            Connected
                                        </span>
                                    )}
                                </div>

                                <p className="mt-1 max-w-xl text-sm text-gray-500">
                                    Connect Loyverse to import receipts, stores,
                                    POS devices, employees, payment types and shifts.
                                </p>

                                <a
                                    href="https://loyverse.com"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-2 inline-flex items-center gap-1
                    text-xs font-medium text-gray-500
                    hover:text-gray-700"
                                >
                                    Visit Loyverse
                                    <ExternalLink size={12} />
                                </a>
                            </div>
                        </div>

                        <Link
                            href="/api/integrations/loyverse/connect"
                            className="inline-flex items-center justify-center
                gap-2 rounded-lg bg-emerald-600 px-4 py-2.5
                text-sm font-medium text-white transition-colors
                hover:bg-emerald-700"
                        >
                            {isConnected ? (
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
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    )
}