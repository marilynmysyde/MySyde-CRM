import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { requestGoogleToken, isGoogleConnected, clearGoogleToken } from '../../lib/googleAuth'
import { fetchTodayEvents, fmtEventTime } from '../../lib/googleCalendar'

// ─── Sample fallback tasks ────────────────────────────────────────────────────

const SAMPLE_DUE = [
  { id: 'sd-1', title: 'Send proposal — MH Chamber', due_date: new Date().toISOString().slice(0, 10), status: 'todo' },
  { id: 'sd-2', title: 'Review creative — Downtown',  due_date: new Date().toISOString().slice(0, 10), status: 'in_progress' },
]
const SAMPLE_OVERDUE = [
  { id: 'so-1', title: 'Design ad creative', due_date: '2026-05-17', status: 'todo' },
]

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
const DEFAULT_EVENT_COLOR = 'bg-[#02348E]'

// ─── AgendaSidebar ────────────────────────────────────────────────────────────

export default function AgendaSidebar() {
  const [dueToday,    setDueToday]    = useState(SAMPLE_DUE)
  const [overdue,     setOverdue]     = useState(SAMPLE_OVERDUE)
  const [renewals,    setRenewals]    = useState([])
  const [events,      setEvents]      = useState([])
  const [gcalConn,    setGcalConn]    = useState(isGoogleConnected())
  const [gcalLoading, setGcalLoading] = useState(false)
  const [gcalError,   setGcalError]   = useState('')

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
      } catch { /* sample data stays */ }
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
    <aside className="w-70 shrink-0 bg-white border-l border-gray-200 h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-100">
        <h2
          className="text-sm font-semibold text-[#02348E] uppercase tracking-wide"
          style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
        >
          Today's Agenda
        </h2>
        <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
          {todayLabel}
        </p>
      </div>

      <div className="p-4 space-y-4">

        {/* Google Calendar Events */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3
              className="text-xs font-semibold text-gray-400 uppercase tracking-wide"
              style={{ fontFamily: 'Roboto, sans-serif' }}
            >
              Events
            </h3>
            {gcalConn ? (
              <button
                onClick={disconnect}
                className="text-[10px] text-gray-400 hover:text-red-400 transition-colors"
                style={{ fontFamily: 'Roboto, sans-serif' }}
                title="Disconnect Google Calendar"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={connectGoogle}
                disabled={gcalLoading}
                className="text-[10px] text-[#02348E] hover:underline disabled:opacity-50"
                style={{ fontFamily: 'Roboto, sans-serif' }}
              >
                {gcalLoading ? 'Connecting…' : '+ Connect Google'}
              </button>
            )}
          </div>

          {gcalLoading && (
            <p className="text-xs text-gray-400 italic" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
              Loading events…
            </p>
          )}

          {gcalError && (
            <p className="text-[10px] text-red-500 leading-snug" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
              {gcalError}
            </p>
          )}

          {!gcalLoading && gcalConn && events.length === 0 && (
            <p className="text-xs text-gray-300 italic" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
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
              style={{ fontFamily: 'Roboto, sans-serif' }}
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
            style={{ fontFamily: 'Roboto, sans-serif' }}
          >
            Due Today
          </h3>
          <div className="space-y-1.5">
            {dueToday.length === 0 ? (
              <p className="text-xs text-gray-300 italic" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
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
              style={{ fontFamily: 'Roboto, sans-serif' }}
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
        <div className="p-4 border-t border-gray-100">
          <p className="text-[10px] text-green-500 text-center" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
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
        style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
      >
        {label}
      </span>
    </div>
  )
}
