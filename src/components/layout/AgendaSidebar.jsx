import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { requestGoogleToken, isGoogleConnected, clearGoogleToken } from '../../lib/googleAuth'
import { fetchTodayEvents, fmtEventTime } from '../../lib/googleCalendar'

// ─── Sample fallback tasks ────────────────────────────────────────────────────

// Google event dot colors by colorId (Google Calendar color IDs 1–11)
const GCAL_COLORS = {
  '1':  'bg-blue-400',    // Lavender → blue
  '2':  'bg-green-400',   // Sage
  '3':  'bg-purple-500',  // Grape
  '4':  'bg-red-400',     // Flamingo
  '5':  'bg-yellow-400',  // Banana
  '6':  'bg-orange-400',  // Tangerine
  '7':  'bg-teal-400',    // Peacock
  '8':  'bg-gray-500',    // Graphite
  '9':  'bg-blue-600',    // Blueberry
  '10': 'bg-green-600',   // Basil
  '11': 'bg-red-600',     // Tomato
}
const DEFAULT_EVENT_COLOR = 'bg-[#1D4ED8]'

// ─── AgendaSidebar ────────────────────────────────────────────────────────────

export default function AgendaSidebar() {
  const [dueToday,    setDueToday]    = useState([])
  const [overdue,     setOverdue]     = useState([])
  const [renewals,    setRenewals]    = useState([])
  const [events,      setEvents]      = useState([])
  const [gcalConn,    setGcalConn]    = useState(isGoogleConnected())
  const [gcalLoading, setGcalLoading] = useState(false)
  const [gcalError,   setGcalError]   = useState('')
  const [mobileOpen,  setMobileOpen]  = useState(false)

  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const todayStr   = new Date().toISOString().slice(0, 10)

  // Fetch due tasks from Supabase
  useEffect(() => {
    async function fetchDueTasks() {
      try {
        const { data } = await supabase
          .from('tasks')
          .select('id, title, due_date, status, partners(name)')
          .neq('status', 'done')
          .lte('due_date', todayStr)
          .order('due_date', { ascending: true })
        if (!data) return
        setDueToday(data.filter(t => t.due_date === todayStr))
        setOverdue(data.filter(t => t.due_date < todayStr))
      } catch { /* ignore */ }
    }

    async function fetchRenewals() {
      try {
        const soon = new Date()
        soon.setDate(soon.getDate() + 30)
        const { data } = await supabase
          .from('deals')
          .select('id, title, renewal_alert, partners(name)')
          .not('stage', 'in', '("closed_won","closed_lost")')
          .gte('renewal_alert', todayStr)
          .lte('renewal_alert', soon.toISOString().slice(0, 10))
          .order('renewal_alert', { ascending: true })
          .limit(5)
        if (data) setRenewals(data)
      } catch { /* no renewals shown */ }
    }

    fetchDueTasks()
    fetchRenewals()

    // This sidebar persists across page navigation and only fetched once on
    // mount, so marking a task done on the Tasks board never cleared it here
    // until a full reload. Re-fetch whenever any task changes.
    window.addEventListener('tasks-changed', fetchDueTasks)
    return () => window.removeEventListener('tasks-changed', fetchDueTasks)
  }, [])

  // Load Google Calendar events if already connected
  useEffect(() => {
    if (gcalConn) loadCalendarEvents()
  }, [gcalConn])

  // Listen for token saved from another page (e.g. Calendar tab)
  useEffect(() => {
    function onTokenReady() {
      setGcalConn(true)
      loadCalendarEvents()
    }
    window.addEventListener('google-token-ready', onTokenReady)
    return () => window.removeEventListener('google-token-ready', onTokenReady)
  }, [])

  async function loadCalendarEvents() {
    setGcalLoading(true)
    try {
      const ev = await fetchTodayEvents()
      setEvents(ev)
    } catch { setEvents([]) }
    setGcalLoading(false)
  }

  async function connectGoogle() {
    setGcalLoading(true)
    setGcalError('')
    try {
      await requestGoogleToken()
      setGcalConn(true)
      // loadCalendarEvents will fire via the effect above
    } catch (e) {
      const msg = !import.meta.env.VITE_GOOGLE_CLIENT_ID
        ? 'VITE_GOOGLE_CLIENT_ID not set in Vercel environment variables.'
        : 'Google sign-in failed. Make sure your Vercel URL is an authorized origin in Google Cloud Console.'
      setGcalError(msg)
      setGcalLoading(false)
    }
  }

  function disconnect() {
    clearGoogleToken()
    setGcalConn(false)
    setEvents([])
  }

  return (
    <aside className="w-full lg:w-70 shrink-0 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 lg:h-full lg:overflow-y-auto">
      {/* Header — tappable on mobile to expand/collapse */}
      <div
        className="p-4 border-b border-gray-100 flex items-center justify-between cursor-pointer lg:cursor-default"
        onClick={() => setMobileOpen(o => !o)}
      >
        <div>
          <h2
            className="text-sm font-semibold text-[#1D4ED8] uppercase tracking-wide"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            Today's Agenda
          </h2>
          <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "'Manrope', sans-serif" }}>
            {todayLabel}
          </p>
        </div>
        {/* Chevron — mobile only */}
        <span className="lg:hidden text-gray-400 text-sm">{mobileOpen ? '▲' : '▼'}</span>
      </div>

      <div className={`p-4 space-y-4 ${mobileOpen ? 'block' : 'hidden'} lg:block`}>

        {/* Google Calendar Events */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3
              className="text-xs font-semibold text-gray-400 uppercase tracking-wide"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              Events
            </h3>
            {gcalConn ? (
              <button
                onClick={disconnect}
                className="text-[10px] text-gray-400 hover:text-red-400 transition-colors"
                style={{ fontFamily: 'Manrope, sans-serif' }}
                title="Disconnect Google Calendar"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={connectGoogle}
                disabled={gcalLoading}
                className="text-[10px] text-[#1D4ED8] hover:underline disabled:opacity-50"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                {gcalLoading ? 'Connecting…' : '+ Connect Google'}
              </button>
            )}
          </div>

          {gcalLoading && (
            <p className="text-xs text-gray-400 italic" style={{ fontFamily: "'Manrope', sans-serif" }}>
              Loading events…
            </p>
          )}

          {gcalError && (
            <p className="text-[10px] text-red-500 leading-snug" style={{ fontFamily: "'Manrope', sans-serif" }}>
              {gcalError}
            </p>
          )}

          {!gcalLoading && gcalConn && events.length === 0 && (
            <p className="text-xs text-gray-300 italic" style={{ fontFamily: "'Manrope', sans-serif" }}>
              No events today
            </p>
          )}

          {!gcalConn && !gcalLoading && (
            <div className="space-y-1.5">
              <AgendaItem color="bg-gray-200" label="Connect Google Calendar to see your events here" />
            </div>
          )}

          {gcalConn && events.length > 0 && (
            <div className="space-y-1.5">
              {events.map(ev => (
                <AgendaItem
                  key={ev.id}
                  color={GCAL_COLORS[ev.colorId] ?? DEFAULT_EVENT_COLOR}
                  label={`${ev.allDay ? 'All day' : fmtEventTime(ev.start)} — ${ev.summary}`}
                />
              ))}
            </div>
          )}
        </section>

        {/* Overdue tasks */}
        {overdue.length > 0 && (
          <section>
            <h3
              className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-2"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              Overdue
            </h3>
            <div className="space-y-1.5">
              {overdue.map(t => (
                <AgendaItem
                  key={t.id}
                  color="bg-red-500"
                  label={`${t.title}${t.partners?.name ? ` — ${t.partners.name}` : ''}`}
                  overdue
                />
              ))}
            </div>
          </section>
        )}

        {/* Due today */}
        <section>
          <h3
            className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            Due Today
          </h3>
          <div className="space-y-1.5">
            {dueToday.length === 0 ? (
              <p className="text-xs text-gray-300 italic" style={{ fontFamily: "'Manrope', sans-serif" }}>
                Nothing due today
              </p>
            ) : dueToday.map(t => (
              <AgendaItem
                key={t.id}
                color="bg-[#f59e0b]"
                label={`${t.title}${t.partners?.name ? ` — ${t.partners.name}` : ''}`}
              />
            ))}
          </div>
        </section>

        {/* Renewal alerts */}
        {renewals.length > 0 && (
          <section>
            <h3
              className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              Renewal Alerts
            </h3>
            <div className="space-y-1.5">
              {renewals.map(r => {
                const daysUntil = Math.ceil(
                  (new Date(r.renewal_alert) - new Date(todayStr)) / (1000 * 60 * 60 * 24)
                )
                const urgent = daysUntil <= 7
                return (
                  <AgendaItem
                    key={r.id}
                    color={urgent ? 'bg-[#f43f5e]' : 'bg-[#f59e0b]'}
                    label={`${daysUntil}d — ${r.title}${r.partners?.name ? ` · ${r.partners.name}` : ''}`}
                  />
                )
              })}
            </div>
          </section>
        )}
      </div>

      {gcalConn && (
        <div className={`p-4 border-t border-gray-100 ${mobileOpen ? 'block' : 'hidden'} lg:block`}>
          <p className="text-[10px] text-green-500 text-center" style={{ fontFamily: "'Manrope', sans-serif" }}>
            ✓ Google Calendar connected
          </p>
        </div>
      )}
    </aside>
  )
}

function AgendaItem({ color, label, overdue = false }) {
  return (
    <div className="flex items-start gap-2">
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1 ${color}`} />
      <span
        className={`text-xs leading-tight ${overdue ? 'text-red-500 font-medium' : 'text-gray-600'}`}
        style={{ fontFamily: "'Manrope', sans-serif" }}
      >
        {label}
      </span>
    </div>
  )
}
