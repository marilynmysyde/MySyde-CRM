export default function RenewalAlert({ deal }) {
  if (!deal.run_end) return null

  const today     = new Date()
  today.setHours(0, 0, 0, 0)
  const runEnd    = new Date(deal.run_end)
  const alertDate = new Date(runEnd)
  alertDate.setDate(alertDate.getDate() - 14)

  if (today < alertDate) return null

  const daysLeft  = Math.ceil((runEnd - today) / (1000 * 60 * 60 * 24))
  const isExpired = daysLeft <= 0

  return (
    <div
      className={`flex items-start gap-3 rounded-lg px-4 py-3 mb-5 ${
        isExpired
          ? 'bg-red-50 border border-red-200'
          : 'bg-[#F59E0B]/20 border border-[#F59E0B]'
      }`}
    >
      <span className="text-xl leading-none mt-0.5">{isExpired ? '🔴' : '⚠️'}</span>
      <div>
        <p
          className="text-sm font-semibold text-[#111827]"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          {isExpired
            ? 'Campaign has expired'
            : `Renewal alert — ${daysLeft} day${daysLeft === 1 ? '' : 's'} remaining`}
        </p>
        <p
          className="text-xs text-gray-600 mt-0.5"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          Run ends {deal.run_end}
          {deal.partners?.name && ` — follow up with ${deal.partners.name} to renew.`}
        </p>
      </div>
    </div>
  )
}
