export default function AgendaSidebar() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <aside className="w-70 shrink-0 bg-white border-l border-gray-200 h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-100">
        <h2
          className="text-sm font-semibold text-[#02348E] uppercase tracking-wide"
          style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
        >
          Today's Agenda
        </h2>
        <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
          {today}
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Events placeholder */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2"
              style={{ fontFamily: 'Roboto, sans-serif' }}>
            Events
          </h3>
          <div className="space-y-1.5">
            <PlaceholderItem color="bg-[#02348E]" label="10:00am — Chamber check-in" />
            <PlaceholderItem color="bg-[#7c3aed]" label="2:00pm — City partner call" />
          </div>
        </section>

        {/* Tasks placeholder */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2"
              style={{ fontFamily: 'Roboto, sans-serif' }}>
            Due Today
          </h3>
          <div className="space-y-1.5">
            <PlaceholderItem color="bg-[#f59e0b]" label="Send proposal — MH Chamber" />
            <PlaceholderItem color="bg-[#0d9488]" label="Review creative — Downtown" />
          </div>
        </section>

        {/* Renewal alerts placeholder */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2"
              style={{ fontFamily: 'Roboto, sans-serif' }}>
            Renewal Alerts
          </h3>
          <div className="space-y-1.5">
            <PlaceholderItem color="bg-[#f43f5e]" label="14 days — Sunrise Bakery ad" />
          </div>
        </section>
      </div>

      <div className="p-4 border-t border-gray-100">
        <p className="text-xs text-gray-300 text-center" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
          Google Calendar syncs in Phase 5
        </p>
      </div>
    </aside>
  )
}

function PlaceholderItem({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${color}`} />
      <span
        className="text-xs text-gray-600 leading-tight"
        style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
      >
        {label}
      </span>
    </div>
  )
}
