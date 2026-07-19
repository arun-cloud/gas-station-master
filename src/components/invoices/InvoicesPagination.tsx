import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type InvoicesPaginationProps = {
  page: number
  pageSize: number
  total: number
  searchParams: Record<string, string | undefined>
}

function buildHref(searchParams: Record<string, string | undefined>, page: number) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(searchParams)) {
    if (value && key !== 'page') params.set(key, value)
  }
  if (page > 1) params.set('page', String(page))
  const query = params.toString()
  return query ? `/invoices?${query}` : '/invoices'
}

export default function InvoicesPagination({
  page,
  pageSize,
  total,
  searchParams,
}: InvoicesPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  if (totalPages <= 1) return null

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  return (
    <div className="flex items-center justify-between px-1 text-sm text-gray-500">
      <span>
        Showing {start}–{end} of {total}
      </span>
      <div className="flex items-center gap-2">
        <Link
          href={buildHref(searchParams, Math.max(1, page - 1))}
          aria-disabled={page <= 1}
          className={`flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 ${
            page <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-gray-50'
          }`}
        >
          <ChevronLeft size={14} />
          Prev
        </Link>
        <span className="text-xs">
          Page {page} of {totalPages}
        </span>
        <Link
          href={buildHref(searchParams, Math.min(totalPages, page + 1))}
          aria-disabled={page >= totalPages}
          className={`flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 ${
            page >= totalPages ? 'pointer-events-none opacity-40' : 'hover:bg-gray-50'
          }`}
        >
          Next
          <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  )
}
