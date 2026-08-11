import { useNavigate } from 'react-router-dom'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import PartnerTypeTag from '../shared/PartnerTypeTag'
import { PLACEMENTS, CATEGORIES } from '../../lib/rateCard'

const CATEGORY_STYLES = {
  digital: 'bg-blue-50 text-[#1D4ED8]',
  wrap:    'bg-amber-50 text-amber-700',
  event:   'bg-purple-50 text-purple-700',
  map:     'bg-teal-50 text-teal-700',
}

function formatCurrency(value) {
  if (!value) return null
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

function PlacementBadge({ placementType }) {
  if (!placementType) return null
  const p   = PLACEMENTS[placementType]
  if (!p) return null
  const cat = CATEGORIES.find(c => c.key === p.category)
  const style = CATEGORY_STYLES[p.category] ?? 'bg-gray-100 text-gray-600'
  const short = p.label.replace('Dynamic ', '').replace(' Sponsor', '').replace(' — Main Face', '').replace(' (Left or Right)', '')
  return (
    <span
      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0 ${style}`}
      style={{ fontFamily: 'Manrope, sans-serif' }}
      title={p.label}
    >
      {cat?.icon} {short.length > 16 ? short.slice(0, 14) + '…' : short}
    </span>
  )
}

// Six-dot grip icon
function GripIcon() {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" className="opacity-30">
      <circle cx="2" cy="2"  r="1.2" /><circle cx="8" cy="2"  r="1.2" />
      <circle cx="2" cy="7"  r="1.2" /><circle cx="8" cy="7"  r="1.2" />
      <circle cx="2" cy="12" r="1.2" /><circle cx="8" cy="12" r="1.2" />
    </svg>
  )
}

export default function DealCard({ deal }) {
  const navigate = useNavigate()

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: deal.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const monthlyDisplay = formatCurrency(deal.monthly_rate)
  const totalDisplay   = formatCurrency(deal.total_value ?? deal.monthly_rate * (deal.months ?? 3))

  function handleCardClick() {
    navigate(`/deal/${deal.id}`)
  }

  function handlePartnerClick(e) {
    e.stopPropagation()
    if (deal.partners?.id) navigate(`/partner/${deal.partners.id}`)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="bg-white rounded-[14px] shadow-sm border border-gray-100 p-3 hover:shadow-md hover:border-gray-200 transition-all group"
    >
      {/* Top row: drag handle + partner tag + package badge */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {/* Drag handle — only this area initiates drag */}
          <div
            {...listeners}
            className="cursor-grab active:cursor-grabbing shrink-0 text-gray-300 hover:text-gray-500 transition-colors pt-0.5"
            onClick={e => e.stopPropagation()}
          >
            <GripIcon />
          </div>
          {deal.partners?.type && (
            <PartnerTypeTag type={deal.partners.type} />
          )}
        </div>
        <PlacementBadge placementType={deal.placement_type ?? deal.package} />
      </div>

      {/* Clickable body — navigates to DealRecord */}
      <div onClick={handleCardClick} className="cursor-pointer">
        {/* Deal title */}
        <p
          className="text-sm font-medium text-[#111827] leading-snug mb-1 group-hover:text-[#1D4ED8] transition-colors"
          style={{ fontFamily: 'Manrope, sans-serif' }}
        >
          {deal.title}
        </p>

        {/* Partner name — clickable link to partner record */}
        {deal.partners?.name && (
          <span
            role="button"
            onClick={handlePartnerClick}
            className={`text-xs mb-2 truncate block transition-colors ${
              deal.partners?.id
                ? 'text-[#1D4ED8] hover:underline cursor-pointer'
                : 'text-gray-400 cursor-default'
            }`}
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            {deal.partners.name}
          </span>
        )}

        {/* Financials */}
        {monthlyDisplay && (
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
            <span
              className="text-xs text-gray-400"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              {monthlyDisplay}/mo
            </span>
            {totalDisplay && (
              <span
                className="text-xs font-semibold text-[#1D4ED8]"
                style={{ fontFamily: "'Manrope', sans-serif" }}
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
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            {deal.run_start} → {deal.run_end ?? '—'}
          </p>
        )}
      </div>
    </div>
  )
}
