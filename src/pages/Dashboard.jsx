import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt$(n) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`
  return `$${n}`
}

function fmtActivity(ts) {
  const d    = new Date(ts)
  const now  = new Date()
  const diff = Math.floor((now - d) / 60_000)
  if (diff < 1)  return 'just now'
  if (diff < 60) return `${diff}m ago`
  const hrs = Math.floor(diff / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Sample data ─────────────────────────────────────────────────────────────

const SAMPLE_STATS = {
  pipelineValue:   48_750,
  liveMRR:         2_350,
  activeKiosks:    3,
  dealsByStage: {
    prospect:    2,
    pitched:     3,
    proposal:    2,
    creative:    1,
    live:        4,
    closed_won:  7,
    closed_lost: 1,
  },
  tasksDueThisWeek:  5,
}

const SAMPLE_RENEWALS = [
  { id: 'r1', title: 'Spring Ad Campaign — Banner Slot',   partner: 'MH Chamber',    run_end: '2026-06-10' },
  { id: 'r2', title: 'PDF Map Bundle',                     partner: 'City of MH',    run_end: '2026-06-18' },
  { id: 'r3', title: 'Full Panel Ad — Downtown Feature',   partner: 'Downtown MH',   run_end: '2026-06-25' },
]

const SAMPLE_ACTIVITY = [
  { id: 'a1', type: 'stage_change',   body: 'Spring Campaign moved to Live',           created_at: new Date(Date.now() - 1_800_000).toISOString() },
  { id: 'a2', type: 'task_complete',  body: 'Send proposal deck — MH Chamber',         created_at: new Date(Date.now() - 3_600_000).toISOString() },
  { id: 'a3', type: 'post_published', body: 'Kiosk Launch Announcement — published',   created_at: new Date(Date.now() - 7_200_000).toISOString() },
  { id: 'a4', type: 'canva_update',   body: 'Creative updated — Downtown Feature',     created_at: new Date(Date.now() - 14_400_000).toISOString() },
  { id: 'a5', type: 'note',           body: 'Call with James Ortega — City of MH',     created_at: new Date(Date.now() - 86_400_000).toISOString() },
  { id: 'a6', type: 'stage_change',   body: 'Civic Center Banner moved to Proposal',   created_at: new Date(Date.now() - 172_800_000).toISOString() },
]

const ACTIVITY_ICONS = {
  note:           { icon: '📝', color: 'text-gray-500'   },
  email:          { icon: '📧', color: 'text-[#02348E]'  },
  call:           { icon: '📞', color: 'text-green-600'  },
  stage_change:   { icon: '🔀', color: 'text-purple-600' },
  canva_update:   { icon: '🎨', color: 'text-pink-600'   },
  task_complete:  { icon: '✅', color: 'text-green-600'  },
  post_published: { icon: '📣', color: 'text-orange-500' },
  gmail_linked:   { icon: '📧', color: 'text-[#02348E]'  },
}

const STAGE_LABELS = {
  prospect: 'Prospect', pitched: 'Pitched', proposal: 'Proposal',
  creative: 'Creative', live: 'Live',
}

const STAGE_COLORS = {
  prospect: 'bg-gray-200',
  pitched:  'bg-blue-300',
  proposal: 'bg-purple-300',
  creative: 'bg-orange-300',
  live:     'bg-green-400',
}

// ─── Stat card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent = false, to }) {
  const inner = (
    <div className={`bg-white rounded-lg border p-4 ${accent ? 'border-[#02348E]/20' : 'border-gray-100'} ${to ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}`}>
      <p
        className={`text-2xl font-bold mb-0.5 ${accent ? 'text-[#02348E]' : 'text-[#010100]'}`}
        style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
      >
        {value}
      </p>
      <p
        className="text-xs text-gray-500 font-medium"
        style={{ fontFamily: 'Roboto, sans-serif' }}
      >
        {label}
      </p>
      {sub && (
        <p className="text-[10px] text-gray-400 mt-1" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
          {sub}
        </p>
      )}
    </div>
  )
  return to ? <Link to={to}>{inner}</Link> : inner
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [stats,    setStats]    = useState({ pipelineValue: 0, liveMRR: 0, activeKiosks: 0, dealsByStage: {}, tasksDueThisWeek: 0 })
  const [activity, setActivity] = useState([])
  const [renewals, setRenewals] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    async function load() {
      try {
        // Pipeline value (non-lost deals)
        const { data: deals } = await supabase
          .from('deals')
          .select('stage, total_value, monthly_rate, months')
          .neq('stage', 'closed_lost')

        // Active kiosks
        const { count: kioskCount } = await supabase
          .from('kiosks')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active')

        // Tasks due this week
        const weekEnd = new Date()
        weekEnd.setDate(weekEnd.getDate() + 7)
        const { count: taskCount } = await supabase
          .from('tasks')
          .select('id', { count: 'exact', head: true })
          .neq('status', 'done')
          .lte('due_date', weekEnd.toISOString().slice(0, 10))

        // Upcoming renewals (run_end within 30 days, still active)
        const today       = new Date().toISOString().slice(0, 10)
        const in30Days    = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10)
        const { data: renewalData } = await supabase
          .from('deals')
          .select('id, title, run_end, partners(name)')
          .not('stage', 'in', '("closed_won","closed_lost")')
          .gte('run_end', today)
          .lte('run_end', in30Days)
          .order('run_end')

        // Recent activity
        const { data: actData } = await supabase
          .from('activity_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10)

        if (deals) {
          const totalVal = deals.reduce((s, d) => s + (Number(d.total_value ?? (d.monthly_rate ?? 0) * (d.months ?? 1)) || 0), 0)
          const liveMRR  = deals.filter(d => d.stage === 'live').reduce((s, d) => s + (Number(d.monthly_rate) || 0), 0)
          const byStage  = {}
          for (const d of deals) { byStage[d.stage] = (byStage[d.stage] ?? 0) + 1 }
          setStats({
            pipelineValue:    totalVal,
            liveMRR,
            activeKiosks:     kioskCount ?? 0,
            dealsByStage:     byStage,
            tasksDueThisWeek: taskCount ?? 0,
          })
        }
        if (renewalData) setRenewals(renewalData.map(d => ({ id: d.id, title: d.title, partner: d.partners?.name ?? '', run_end: d.run_end })))
        if (actData) setActivity(actData)
      } catch { /* ignore */ }
      setLoading(false)
    }
    load()
  }, [])

  const openDeals  = Object.entries(stats.dealsByStage ?? {})
    .filter(([s]) => Object.keys(STAGE_LABELS).includes(s))
  const totalOpen  = openDeals.reduce((s, [, c]) => s + c, 0)
  const maxCount   = Math.max(...openDeals.map(([, c]) => c), 1)

  return (
    <div className="px-4 py-4 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-xl font-semibold text-[#010100]"
          style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
        >
          Dashboard
        </h1>
        {loading && (
          <span className="text-xs text-gray-400" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
            Loading…
          </span>
        )}
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Live MRR"
          value={fmt$(stats.liveMRR ?? 0)}
          sub="Monthly from live deals"
          accent
          to="/board"
        />
        <StatCard
          label="Pipeline Value"
          value={fmt$(stats.pipelineValue)}
          sub="Open deals excl. lost"
          to="/board"
        />
        <StatCard
          label="Active Kiosks"
          value={stats.activeKiosks}
          sub="Live in the field"
          to="/kiosks"
        />
        <StatCard
          label="Tasks Due This Week"
          value={stats.tasksDueThisWeek}
          sub="Across all partners"
          to="/tasks"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Pipeline by stage */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-100 p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-sm font-semibold text-[#010100]"
                style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
              >
                Open Deals by Stage
              </h2>
              <Link
                to="/board"
                className="text-xs text-[#02348E] hover:underline"
                style={{ fontFamily: 'Roboto, sans-serif' }}
              >
                View board →
              </Link>
            </div>

            {openDeals.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-4 text-center" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                No open deals.
              </p>
            ) : (
              <div className="space-y-3">
                {openDeals.map(([stage, count]) => (
                  <div key={stage} className="flex items-center gap-3">
                    <span
                      className="text-xs text-gray-500 w-18 shrink-0"
                      style={{ fontFamily: 'Roboto, sans-serif' }}
                    >
                      {STAGE_LABELS[stage]}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${STAGE_COLORS[stage] ?? 'bg-gray-300'} transition-all`}
                        style={{ width: `${(count / maxCount) * 100}%` }}
                      />
                    </div>
                    <span
                      className="text-xs font-semibold text-[#010100] w-4 text-right shrink-0"
                      style={{ fontFamily: 'Roboto, sans-serif' }}
                    >
                      {count}
                    </span>
                  </div>
                ))}
                <p
                  className="text-[10px] text-gray-400 pt-1"
                  style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
                >
                  {totalOpen} open deals total
                </p>
              </div>
            )}
          </div>

          {/* Upcoming renewals */}
          {renewals.length > 0 && (
            <div className="bg-white rounded-lg border border-amber-100 p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h2
                  className="text-sm font-semibold text-[#010100]"
                  style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
                >
                  Renewals in Next 30 Days
                </h2>
                <span
                  className="text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full"
                  style={{ fontFamily: 'Roboto, sans-serif' }}
                >
                  {renewals.length}
                </span>
              </div>
              <div className="space-y-2">
                {renewals.map(r => {
                  const daysLeft = Math.ceil((new Date(r.run_end) - new Date()) / 86_400_000)
                  return (
                    <Link
                      key={r.id}
                      to={`/deal/${r.id}`}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-amber-50/60 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#010100] truncate" style={{ fontFamily: 'Roboto, sans-serif' }}>
                          {r.title}
                        </p>
                        <p className="text-[10px] text-gray-400" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                          {r.partner}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-semibold shrink-0 px-2 py-0.5 rounded-full ${
                          daysLeft <= 7 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'
                        }`}
                        style={{ fontFamily: 'Roboto, sans-serif' }}
                      >
                        {daysLeft}d
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Quick links */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Sales Board',    to: '/board',    icon: '📋' },
              { label: 'Partners',       to: '/partners', icon: '🤝' },
              { label: 'Social',         to: '/social',   icon: '📱' },
            ].map(l => (
              <Link
                key={l.to}
                to={l.to}
                className="bg-white rounded-lg border border-gray-100 p-3 flex items-center gap-2 hover:border-[#02348E]/30 hover:bg-[#02348E]/5 transition-colors"
              >
                <span>{l.icon}</span>
                <span className="text-xs font-medium text-[#010100]" style={{ fontFamily: 'Roboto, sans-serif' }}>
                  {l.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-100 p-4">
            <h2
              className="text-sm font-semibold text-[#010100] mb-3"
              style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
            >
              Recent Activity
            </h2>

            {activity.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-4 text-center" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                No activity yet.
              </p>
            ) : (
              <div className="space-y-3">
                {activity.slice(0, 8).map(entry => {
                  const cfg = ACTIVITY_ICONS[entry.type] ?? ACTIVITY_ICONS.note
                  return (
                    <div key={entry.id} className="flex gap-3 pb-3 border-b border-gray-50 last:border-0">
                      <span className="text-base mt-0.5 shrink-0 leading-none">{cfg.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-xs text-[#010100] leading-snug"
                          style={{ fontFamily: 'Roboto, sans-serif' }}
                        >
                          {entry.body}
                        </p>
                        <p
                          className="text-[10px] text-gray-400 mt-0.5"
                          style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
                        >
                          {fmtActivity(entry.created_at)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
