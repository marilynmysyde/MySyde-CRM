import { useEffect, useState, useCallback } from 'react'
import { isGoogleConnected, requestGoogleToken } from '../lib/googleAuth'
import { fetchTodayEvents, fmtEventTime } from '../lib/googleCalendar'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function startOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function fmtMonthYear(date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function fmtDayLabel(date) {
  return date.toLocaleDateString('en-US', { weekday: 'short' })
}

function fmtDayNum(date) {
  return date.getDate()
}

// Google event dot colors
const GCAL_COLORS = {
  '1': 'bg-blue-400', '2': 'bg-green-400', '3': 'bg-purple-500',
  '4': 'bg-red-400',  '5': 'bg-yellow-400','6': 'bg-orange-400',
  '7': 'bg-teal-400', '8': 'bg-gray-500',  '9': 'bg-blue-600',
  '10':'bg-green-600','11':'bg-red-600',
}
const GCAL_BG = {
  '1': 'bg-blue-50 border-blue-200 text-blue-800',
  '2': 'bg-green-50 border-green-200 text-green-800',
  '3': 'bg-purple-50 border-purple-200 text-purple-800',
  '4': 'bg-red-50 border-red-200 text-red-700',
  '5': 'bg-yellow-50 border-yellow-200 text-yellow-800',
  '6': 'bg-orange-50 border-orange-200 text-orange-800',
  '7': 'bg-teal-50 border-teal-200 text-teal-800',
  '9': 'bg-blue-100 border-blue-300 text-blue-900',
}
const DEFAULT_EVENT_BG = 'bg-[#02348E]/10 border-[#02348E]/20 text-[#02348E]'

// ─── Fetch events for a full week ─────────────────────────────────────────────

async function fetchWeekEvents(weekStart) {
  const token = (await import('../lib/googleAuth')).getGoogleToken()
  if (!token) return []

  const weekEnd = addDays(weekStart, 7)
  const params  = new URLSearchParams({
    timeMin:      weekStart.toISOString(),
    timeMax:      weekEnd.toISOString(),
    singleEvents: 'true',
    orderBy:      'startTime',
    maxResults:   '50',
  })

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) return []
  const { items = [] } = await res.json()
  return items.map(e => ({
    id:      e.id,
    summary: e.summary ?? '(No title)',
    start:   e.start?.dateTime ?? e.start?.date ?? null,
    end:     e.end?.dateTime   ?? e.end?.date   ?? null,
    colorId: e.colorId ?? null,
    allDay:  !e.start?.dateTime,
  }))
}

// ─── Event card ───────────────────────────────────────────────────────────────

function EventCard({ event }) {
  const bg = GCAL_BG[event.colorId] ?? DEFAULT_EVENT_BG
  return (
    <div className={`text-[11px] rounded px-2 py-1 border leading-snug ${bg}`} style={{ fontFamily: 'Roboto, sans-serif' }}>
      {!event.allDay && (
        <span className="font-semibold mr-1">{fmtEventTime(event.start)}</span>
      )}
      {event.summary}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Calendar() {
  const today              = new Date()
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today))
  const [events,    setEvents]    = useState([])
  const [connected, setConnected] = useState(isGoogleConnected())
  const [loading,   setLoading]   = useState(false)
  const [authError, setAuthError] = useState('')

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const load = useCallback(async (ws) => {
    setLoading(true)
    try {
      const ev = await fetchWeekEvents(ws)
      setEvents(ev)
    } catch { setEvents([]) }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (connected) load(weekStart)
  }, [connected, weekStart])

  async function connect() {
    setLoading(true)
    setAuthError('')
    try {
      await requestGoogleToken()
      setConnected(true)
    } catch {
      const msg = !import.meta.env.VITE_GOOGLE_CLIENT_ID
        ? 'VITE_GOOGLE_CLIENT_ID is not set. Add it to your Vercel environment variables.'
        : 'Sign-in failed. Make sure your Vercel URL is listed as an authorized JavaScript origin in Google Cloud Console.'
      setAuthError(msg)
      setLoading(false)
    }
  }

  function prevWeek() { setWeekStart(w => addDays(w, -7)) }
  function nextWeek() { setWeekStart(w => addDays(w,  7)) }
  function goToday()  { setWeekStart(startOfWeek(today)) }

  // Group events by day
  function eventsForDay(day) {
    return events.filter(ev => {
      if (!ev.start) return false
      const evDate = new Date(ev.start)
      return isSameDay(evDate, day)
    })
  }

  const isCurrentWeek = isSameDay(weekStart, startOfWeek(today))

  return (
    <div className="px-4 py-4 h-full flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1
            className="text-xl font-semibold text-[#010100]"
            style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
          >
            Calendar
          </h1>
          <span
            className="text-sm text-gray-500"
            style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
          >
            {fmtMonthYear(weekStart)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {loading && (
            <span className="text-xs text-gray-400" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
              Loading…
            </span>
          )}

          {/* Week navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={prevWeek}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors"
              title="Previous week"
            >
              ‹
            </button>
            {!isCurrentWeek && (
              <button
                onClick={goToday}
                className="text-xs px-2.5 py-1 rounded border border-gray-200 text-gray-600 hover:border-[#02348E] hover:text-[#02348E] transition-colors"
                style={{ fontFamily: 'Roboto, sans-serif' }}
              >
                Today
              </button>
            )}
            <button
              onClick={nextWeek}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors"
              title="Next week"
            >
              ›
            </button>
          </div>

          {/* Connect button */}
          {!connected ? (
            <button
              onClick={connect}
              disabled={loading}
              className="bg-[#02348E] hover:bg-[#02348E]/90 disabled:opacity-50 text-white text-sm font-medium px-3 py-1.5 rounded transition-colors"
              style={{ fontFamily: 'Roboto, sans-serif' }}
            >
              Connect Google Calendar
            </button>
          ) : (
            <span className="text-xs text-green-600 font-medium" style={{ fontFamily: 'Roboto, sans-serif' }}>
              ✓ Google Calendar
            </span>
          )}
        </div>
      </div>

      {/* Not connected state */}
      {!connected && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm">
            <p className="text-4xl mb-3">📅</p>
            <h2
              className="text-base font-semibold text-[#010100] mb-2"
              style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
            >
              Connect Google Calendar
            </h2>
            <p
              className="text-sm text-gray-500 mb-4"
              style={{ fontFamily: 'Roboto, sans-serif' }}
            >
              See all your meetings and events alongside your deals, tasks, and posts.
            </p>
            <button
              onClick={connect}
              disabled={loading}
              className="bg-[#02348E] hover:bg-[#02348E]/90 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded transition-colors"
              style={{ fontFamily: 'Roboto, sans-serif' }}
            >
              {loading ? 'Connecting…' : 'Connect Google Calendar'}
            </button>
            {authError && (
              <p className="text-xs text-red-500 mt-3 max-w-xs" style={{ fontFamily: 'Roboto, sans-serif' }}>
                {authError}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Week grid */}
      {connected && (
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-7 gap-2 min-w-[600px]">

            {/* Day headers */}
            {days.map(day => {
              const isToday = isSameDay(day, today)
              return (
                <div key={day.toISOString()} className="text-center pb-2">
                  <p
                    className="text-[10px] text-gray-400 uppercase tracking-wide"
                    style={{ fontFamily: 'Roboto, sans-serif' }}
                  >
                    {fmtDayLabel(day)}
                  </p>
                  <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full mx-auto mt-0.5 ${
                    isToday ? 'bg-[#02348E] text-white' : 'text-[#010100]'
                  }`}>
                    <span
                      className="text-sm font-semibold"
                      style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
                    >
                      {fmtDayNum(day)}
                    </span>
                  </div>
                </div>
              )
            })}

            {/* Day columns */}
            {days.map(day => {
              const isToday  = isSameDay(day, today)
              const dayEvs   = eventsForDay(day)
              return (
                <div
                  key={day.toISOString() + '-col'}
                  className={`min-h-[400px] rounded-lg p-2 space-y-1.5 ${
                    isToday ? 'bg-[#02348E]/5 ring-1 ring-[#02348E]/20' : 'bg-white border border-gray-100'
                  }`}
                >
                  {dayEvs.length === 0 && (
                    <p
                      className="text-[10px] text-gray-300 italic text-center pt-4"
                      style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
                    >
                      —
                    </p>
                  )}
                  {dayEvs.map(ev => (
                    <EventCard key={ev.id} event={ev} />
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
