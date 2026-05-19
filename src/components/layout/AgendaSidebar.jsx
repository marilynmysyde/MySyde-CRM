import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

// ─── Sample fallback tasks ────────────────────────────────────────────────────

const SAMPLE_DUE = [
  { id: 'sd-1', title: 'Send proposal — MH Chamber', due_date: new Date().toISOString().slice(0, 10), status: 'todo' },
  { id: 'sd-2', title: 'Review creative — Downtown',  due_date: new Date().toISOString().slice(0, 10), status: 'in_progress' },
]

const SAMPLE_OVERDUE = [
  { id: 'so-1', title: 'Design ad creative',   due_date: '2026-05-17', status: 'todo' },
]

// ─── AgendaSidebar ────────────────────────────────────────────────────────────

export default function AgendaSidebar() {
  const [dueToday,  setDueToday]  = useState(SAMPLE_DUE)
  const [overdue,   setOverdue]   = useState(SAMPLE_OVERDUE)

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  const todayStr = new Date().toISOString().slice(0, 10)

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
      } catch { /* no Supabase — sample data stays */ }
    }
    fetchDueTasks()
  }, [])

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

        {/* Events — still static until Phase 5 Google Calendar */}
        <section>
          <h3
            className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2"
            style={{ fontFamily: 'Roboto, sans-serif' }}
          >
            Events
          </h3>
          <div className="space-y-1.5">
            <AgendaItem color="bg-[#02348E]" label="10:00am — Chamber check-in" />
            <AgendaItem color="bg-[#7c3aed]" label="2:00pm — City partner call" />
          </div>
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
              <p
                className="text-xs text-gray-300 italic"
                style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
              >
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

        {/* Renewal alerts placeholder */}
        <section>
          <h3
            className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2"
            style={{ fontFamily: 'Roboto, sans-serif' }}
          >
            Renewal Alerts
          </h3>
          <div className="space-y-1.5">
            <AgendaItem color="bg-[#f43f5e]" label="14 days — Sunrise Bakery ad" />
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
