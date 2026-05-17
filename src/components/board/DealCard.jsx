import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import PartnerTypeTag from '../shared/PartnerTypeTag'

const PACKAGE_STYLES = {
  starter:  'bg-gray-100 text-gray-600',
  standard: 'bg-blue-50 text-[#02348E]',
  premium:  'bg-yellow-50 text-yellow-700',
}

function formatCurrency(value) {
  if (!value) return null
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

export default function DealCard({ deal }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: deal.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const monthlyDisplay  = formatCurrency(deal.monthly_rate)
  const totalDisplay    = formatCurrency(deal.total_value ?? deal.monthly_rate * (deal.months ?? 3))
  const packageStyle    = PACKAGE_STYLES[deal.package] ?? PACKAGE_STYLES.starter

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
    >
      {/* Partner tag + package badge */}
      <div className="flex items-center justify-between gap-2 mb-2">
        {deal.partners?.type && (
          <PartnerTypeTag type={deal.partners.type} />
        )}
        {deal.package && (
          <span
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide ${packageStyle}`}
            style={{ fontFamily: 'Roboto, sans-serif' }}
          >
            {deal.package}
          </span>
        )}
      </div>

      {/* Deal title */}
      <p
        className="text-sm font-medium text-[#010100] leading-snug mb-1"
        style={{ fontFamily: 'Roboto, sans-serif' }}
      >
        {deal.title}
      </p>

      {/* Partner name */}
      {deal.partners?.name && (
        <p
          className="text-xs text-gray-400 mb-2 truncate"
          style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
        >
          {deal.partners.name}
        </p>
      )}

      {/* Financials */}
      {monthlyDisplay && (
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
          <span
            className="text-xs text-gray-400"
            style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
          >
            {monthlyDisplay}/mo
          </span>
          {totalDisplay && (
            <span
              className="text-xs font-semibold text-[#02348E]"
              style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
            >
              {totalDisplay} total
            </span>
          )}
        </div>
      )}

      {/* Run dates */}
      {deal.run_start && (
        <p
          className="text-[10px] text-gray-300 mt-1"
          style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
        >
          {deal.run_start} → {deal.run_end ?? '—'}
        </p>
      )}
    </div>
  )
}
