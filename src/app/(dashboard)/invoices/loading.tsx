export default function InvoicesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-40 rounded bg-gray-200" />
          <div className="h-4 w-56 rounded bg-gray-100" />
        </div>
        <div className="h-9 w-28 rounded-lg bg-gray-200" />
      </div>
      <div className="h-28 rounded-xl border border-gray-200 bg-gray-50" />
      <div className="h-80 rounded-xl border border-gray-200 bg-gray-50" />
    </div>
  )
}
