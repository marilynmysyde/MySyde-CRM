const TYPE_STYLES = {
  chamber:        'bg-blue-100 text-blue-800',
  city_gov:       'bg-purple-100 text-purple-800',
  downtown_assoc: 'bg-teal-100 text-teal-800',
  community_org:  'bg-rose-100 text-rose-800',
  nonprofit:      'bg-rose-100 text-rose-800',
  local_business: 'bg-amber-100 text-amber-800',
  other:          'bg-gray-100 text-gray-600',
}

const TYPE_LABELS = {
  chamber:        'Chamber',
  city_gov:       'City / Gov',
  downtown_assoc: 'Downtown',
  community_org:  'Community',
  nonprofit:      'Nonprofit',
  local_business: 'Business',
  other:          'Other',
}

export default function PartnerTypeTag({ type, className = '' }) {
  const style = TYPE_STYLES[type] ?? TYPE_STYLES.other
  const label = TYPE_LABELS[type] ?? type

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${style} ${className}`}
      style={{ fontFamily: 'Roboto, sans-serif' }}
    >
      {label}
    </span>
  )
}
