// Reusable empty-state UI. Two modes:
//   "onboarding" — nothing exists yet, guide to add the first one
//   "filtered"   — items exist but current filter/search hides them, guide to reset

export default function EmptyState({
  icon,
  title,
  subtitle,
  ctaLabel,
  onCta,
  variant = 'onboarding',
}) {
  const isFiltered = variant === 'filtered'
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      {icon && (
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
          isFiltered ? 'bg-gray-100 text-gray-400' : 'bg-[#1D4ED8]/10 text-[#1D4ED8]'
        }`}>
          <span className="text-xl leading-none">{icon}</span>
        </div>
      )}
      <h3 className="text-sm font-semibold text-[#111827] mb-1">{title}</h3>
      {subtitle && (
        <p className="text-xs text-gray-500 max-w-xs mb-4 leading-relaxed">
          {subtitle}
        </p>
      )}
      {ctaLabel && onCta && (
        <button
          onClick={onCta}
          className={`text-xs font-semibold px-3 py-1.5 rounded transition-colors ${
            isFiltered
              ? 'text-gray-600 border border-gray-200 hover:border-[#1D4ED8] hover:text-[#1D4ED8]'
              : 'bg-[#1D4ED8] text-white hover:bg-[#1D4ED8]/90'
          }`}
        >
          {ctaLabel}
        </button>
      )}
    </div>
  )
}
