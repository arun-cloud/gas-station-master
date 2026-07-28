import Link from 'next/link'

export default function SuppliersPagination({
  page,
  pageSize,
  total,
  searchParams,
}: {
  page: number
  pageSize: number
  total: number
  searchParams: Record<string, string | undefined>
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (totalPages <= 1) return null

  function href(nextPage: number) {
    const params = new URLSearchParams()
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value && key !== 'page') params.set(key, value)
    })
    params.set('page', String(nextPage))
    return `/suppliers?${params.toString()}`
  }

  return (
    <div className="flex items-center justify-between text-sm text-gray-500">
      <span>
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        <Link
          aria-disabled={page <= 1}
          href={page <= 1 ? '#' : href(page - 1)}
          className={`rounded-lg border px-3 py-2 ${
            page <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-gray-50'
          }`}
        >
          Previous
        </Link>
        <Link
          aria-disabled={page >= totalPages}
          href={page >= totalPages ? '#' : href(page + 1)}
          className={`rounded-lg border px-3 py-2 ${
            page >= totalPages ? 'pointer-events-none opacity-40' : 'hover:bg-gray-50'
          }`}
        >
          Next
        </Link>
      </div>
    </div>
  )
}
