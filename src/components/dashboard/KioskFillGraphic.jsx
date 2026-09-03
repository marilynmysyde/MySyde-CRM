import { MAX_SLOTS } from '../../lib/rateCard'

// Two literal kiosk screens (front + back), each broken into its real ad zones.
// Fills in from live deal data as slots actually get booked — not decorative.
const ZONES = [
  { key: 'top_banner',      label: 'Top Banner' },
  { key: 'middle_takeover', label: 'Middle Takeover' },
  { key: 'bottom_banner',   label: 'Bottom Banner' },
  { key: 'featured_box',    label: 'Featured Boxes' },
  { key: 'search_button',   label: 'Search Buttons' },
]

function zoneCount(deals, type, screen) {
  return deals.filter(d =>
    d.placement_type === type && (d.screen === screen || d.screen === 'both')
  ).length
}

function ScreenCard({ label, screen, deals }) {
  return (
    <div className="flex-1 min-w-0 rounded-[14px] border-2 border-gray-200 bg-gray-50 p-3">
      <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 mb-2 text-center">
        {label}
      </p>
      <div className="space-y-2">
        {ZONES.map(zone => {
          const max    = MAX_SLOTS[zone.key]?.perScreen || 0
          const booked = zoneCount(deals, zone.key, screen)
          const pct    = max ? Math.min(100, Math.round((booked / max) * 100)) : 0
          const full   = max > 0 && booked >= max
          return (
            <div key={zone.key}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] text-gray-600 font-medium truncate">{zone.label}</span>
                <span className={`text-[10px] font-semibold ${full ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {booked}/{max}
                </span>
              </div>
              <div className="h-2 bg-white rounded-full overflow-hidden border border-gray-200">
                <div
                  className={`h-full transition-all duration-500 ${full ? 'bg-emerald-500' : 'bg-[#1D4ED8]'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function KioskFillGraphic({ deals }) {
  // Deals booked before per-screen tracking existed (or never assigned one)
  // still count in the real "sold" total elsewhere on this dashboard — surface
  // them here instead of letting them silently vanish from the visual.
  const unassigned = deals.filter(d => !d.screen)

  return (
    <div className="bg-white rounded-[14px] border border-gray-100 p-4">
      <h2 className="text-sm font-semibold text-[#111827] mb-3">The Kiosk, Filling In</h2>
      <div className="flex items-stretch gap-3">
        <ScreenCard label="Front · Screen 1" screen="screen_1" deals={deals} />

        {/* Spine — fully claimed by founding partners, not sellable */}
        <div className="w-10 shrink-0 rounded-[10px] bg-gradient-to-b from-gray-200 to-gray-300 flex flex-col items-center justify-center gap-1 py-2">
          <span className="text-[8px] font-extrabold text-gray-600 uppercase tracking-wider [writing-mode:vertical-rl]">
            Spine
          </span>
        </div>

        <ScreenCard label="Back · Screen 2" screen="screen_2" deals={deals} />
      </div>
      <p className="text-[11px] text-gray-500 mt-3">
        Spine: 5/5 founding-partner tiles, not sellable — City, Parks &amp; Rec, Chamber, MG Constructors, Grafikx USA.
      </p>
      {unassigned.length > 0 && (
        <p className="text-[11px] text-amber-600 mt-1.5 font-medium">
          ⚠ {unassigned.length} booked {unassigned.length === 1 ? 'deal isn’t' : 'deals aren’t'} assigned a screen yet, so {unassigned.length === 1 ? 'it isn’t' : 'they aren’t'} reflected above — counted correctly in "Ad Inventory" though. Pick a screen on each deal to make this graphic match reality.
        </p>
      )}
    </div>
  )
}
