// Real firsts, computed live from actual deals — not a separate tracked log.
// Earned badges stay lit permanently once true; unearned ones stay visible but
// dim, so the team can see what's coming next, not just what's done.
const BADGES = [
  { key: 'firstSlot',     icon: '🚀', label: 'First Slot Booked' },
  { key: 'quarterScreen', icon: '🖥️', label: 'A Screen 25% Full' },
  { key: 'firstPaying',   icon: '💰', label: 'First Paying Advertiser' },
  { key: 'categoryFull',  icon: '🏆', label: 'A Category Sold Out' },
]

export default function TrophyBadges({ trophies }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
      {BADGES.map(b => {
        const earned = !!trophies[b.key]
        return (
          <div
            key={b.key}
            className={`rounded-[14px] border p-3 text-center transition-colors ${
              earned
                ? 'bg-white border-amber-200 shadow-sm'
                : 'bg-gray-50 border-gray-100'
            }`}
          >
            <span className={`text-xl block mb-1 ${earned ? '' : 'grayscale opacity-40'}`}>{b.icon}</span>
            <p className={`text-[10px] font-semibold leading-snug ${earned ? 'text-[#111827]' : 'text-gray-400'}`}>
              {b.label}
            </p>
            <p className={`text-[9px] mt-0.5 font-medium uppercase tracking-wide ${earned ? 'text-amber-600' : 'text-gray-300'}`}>
              {earned ? 'Earned' : 'Not yet'}
            </p>
          </div>
        )
      })}
    </div>
  )
}
