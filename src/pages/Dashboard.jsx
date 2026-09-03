import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { MAX_SLOTS } from '../lib/rateCard'
import ConfettiBurst from '../components/tasks/ConfettiBurst'
import CelebrateToast from '../components/tasks/CelebrateToast'
import KioskFillGraphic from '../components/dashboard/KioskFillGraphic'
import TrophyBadges from '../components/dashboard/TrophyBadges'

// ═══════════════════════════════════════════════════════════════════════════
// LAUNCH COMMAND CENTER — Morgan Hill kiosk launch
// Reviewing this setup? See context/decisions.md (2026-08-13 entry).
// Post-launch (~2026-10-12), reassess whether to swap to Option A (task-first).
// ═══════════════════════════════════════════════════════════════════════════

// ─── EDIT ME as launch details firm up ──────────────────────────────────────

// Set to the date the kiosk is set in the cement downtown and live/operational.
// Countdown flips to "Day N Live" after this date passes. Leave as `null` to hide the countdown.
const LAUNCH_DATE = '2026-09-01'   // True cone-free, fully open-to-the-public date (confirmed by Marilyn 2026-09-03). 8/24 was kiosk pickup/install only — cones stayed up around the front until 9/1.

// Fallback used only if the launch_milestones table is missing/empty.
// Once the table is populated (see supabase/schema.sql), milestones load from DB
// and toggle via clicking the circles on the dashboard.
const DEFAULT_MILESTONES = [
  { slug: 'installed', label: 'Kiosk installed',       status: 'todo', sort_order: 1 },
  { slug: 'content',   label: 'Launch content loaded', status: 'todo', sort_order: 2 },
  { slug: 'ribbon',    label: 'Ribbon cutting',        status: 'todo', sort_order: 3 },
]

// Morgan Hill TRUE sellable inventory ceiling, recalculated 2026-09-03 from the
// live rate card (front screen + back screen + spine + events; excludes the free
// community_static_slot cards and the separate PDF Downtown Map product).
// Digital (×2 for front+back): top_banner 10, bottom_banner 10, middle_takeover 1,
// featured_box 3, search_button 5  => 29/screen x 2 = 58
// Wrap: primary_wrap 1 + side_qr_tile 0 (spine sold out to founding partners, see
// rateCard.js) = 1. Events: featured_event 1.
// 58 + 1 + 1 = 60. Adjust if the rate card's slot counts change.
const TOTAL_PLACEMENT_SLOTS = 60
// Full-sellout MRR at Option 2 (Recommended) rates for the 60 slots above:
// top_banner 450x20=9000, bottom_banner 350x20=7000, middle_takeover 3250x2=6500,
// featured_box 750x6=4500, search_button 400x10=4000, primary_wrap 2500x1=2500,
// featured_event 350x1=350. Total = 33,850.
const POTENTIAL_MRR = 33_850

// ─── Word / quote of the day ─────────────────────────────────────────────────
// Rotates deterministically by day of year (no randomness, no API — same line
// all day, different every day). Mixes MySyde's own mission voice (brand/overview.md)
// with launch-specific momentum lines. Add to this list any time; order doesn't matter.
const DAILY_LINES = [
  { type: 'word',  text: 'MOMENTUM', sub: 'Small moves, repeated daily, become unstoppable.' },
  { type: 'quote', text: 'Communities thrive when local connections thrive.' },
  { type: 'word',  text: 'BUILD', sub: 'What you create today is what tomorrow stands on.' },
  { type: 'quote', text: 'Every slot filled is one more neighbor discovered.' },
  { type: 'word',  text: 'CONNECT', sub: 'Every relationship you build is infrastructure for growth.' },
  { type: 'quote', text: 'Local businesses deserve visibility beyond algorithms.' },
  { type: 'word',  text: 'PERSIST', sub: 'The ones who last are the ones who don’t quit on a quiet day.' },
  { type: 'quote', text: 'Technology should bring people together, not separate them.' },
  { type: 'word',  text: 'GROWTH', sub: 'Progress doesn’t ask permission — it asks for action.' },
  { type: 'quote', text: 'Community is more than where you live — it’s who you support.' },
  { type: 'word',  text: 'EMPOWER', sub: 'Give someone visibility, and you give them a real chance.' },
  { type: 'quote', text: 'Morgan Hill is watching. Let’s give them something to see.' },
  { type: 'word',  text: 'SHOW UP', sub: 'Consistency beats intensity, every single time.' },
  { type: 'quote', text: 'We help businesses be seen and heard.' },
  { type: 'word',  text: 'STEADY', sub: 'Slow and real outlasts fast and fake.' },
  { type: 'quote', text: 'Small business wins are community wins.' },
  { type: 'word',  text: 'FOCUS', sub: 'One clear priority beats ten scattered ones.' },
  { type: 'quote', text: 'Real relationships. Real visibility. Real Morgan Hill.' },
  { type: 'word',  text: 'CLAIM IT', sub: 'Nobody hands you the win — you build it, then you take it.' },
  { type: 'quote', text: 'Strong communities create stronger local economies.' },
  { type: 'word',  text: 'ONE MORE', sub: 'One more call, one more slot, one more yes — that’s how it’s won.' },
  { type: 'quote', text: 'The kiosk doesn’t sleep. Keep the momentum with it.' },
  { type: 'word',  text: 'FORWARD', sub: 'In business, you’re either building or falling behind.' },
  { type: 'quote', text: 'Every number here is a real neighbor, seen.' },
]

function dailyLine() {
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 0)
  const dayOfYear = Math.floor((now - startOfYear) / 86_400_000)
  return DAILY_LINES[dayOfYear % DAILY_LINES.length]
}

function DailyLine() {
  const line = dailyLine()
  return (
    <div className="mb-3 rounded-[14px] border border-[#F59E0B]/25 bg-[#FEF3C7]/50 px-4 py-3 flex items-start gap-3">
      <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 shrink-0 mt-0.5">
        {line.type === 'word' ? "Today's Word" : "Today's Reminder"}
      </span>
      <div className="min-w-0">
        {line.type === 'word' ? (
          <>
            <p className="text-sm font-extrabold tracking-wide text-[#111827] leading-tight">{line.text}</p>
            {line.sub && (
              <p className="text-xs text-gray-600 mt-0.5 leading-snug">{line.sub}</p>
            )}
          </>
        ) : (
          <p className="text-sm italic text-[#111827]">"{line.text}"</p>
        )}
      </div>
    </div>
  )
}

// ─── Helpers ────────────────────────────────────────────────────────────────

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

function fmtToday() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

// Days until launch. Positive = pre-launch. Zero = today. Negative = live for N days.
function launchDelta() {
  if (!LAUNCH_DATE) return null
  const launch = new Date(LAUNCH_DATE + 'T00:00:00')
  const today  = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((launch - today) / 86_400_000)
}

// ─── Sample fallbacks (used when Supabase returns nothing) ──────────────────

const SAMPLE_ACTIVITY = [
  { id: 'a1', type: 'stage_change',  body: 'Spring Campaign moved to Live',    created_at: new Date(Date.now() - 1_800_000).toISOString() },
  { id: 'a2', type: 'task_complete', body: 'Send proposal deck — MH Chamber',  created_at: new Date(Date.now() - 3_600_000).toISOString() },
  { id: 'a3', type: 'note',          body: 'Call with James Ortega — City',    created_at: new Date(Date.now() - 86_400_000).toISOString() },
]

const ACTIVITY_ICONS = {
  note:           '📝',
  email:          '📧',
  call:           '📞',
  stage_change:   '🔀',
  canva_update:   '🎨',
  task_complete:  '✅',
  post_published: '📣',
  gmail_linked:   '📧',
}

// ─── Launch hero ────────────────────────────────────────────────────────────

function LaunchHero() {
  const delta = launchDelta()
  if (delta === null) return null

  const preLaunch = delta > 0
  const isToday   = delta === 0
  const live      = delta < 0

  const headline = preLaunch
    ? `Morgan Hill kiosk live in ${delta} ${delta === 1 ? 'day' : 'days'}`
    : isToday
      ? 'Kiosk set in the cement today — Morgan Hill goes live'
      : `Live — Day ${Math.abs(delta)} in Morgan Hill`

  const sub = preLaunch
    ? new Date(LAUNCH_DATE + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : live
      ? 'Launch date: ' + new Date(LAUNCH_DATE + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : 'Today'

  return (
    <div
      className="mb-6 rounded-[14px] px-5 py-4 flex items-center justify-between gap-4"
      style={{
        background: live
          ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
          : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      }}
    >
      <div className="min-w-0">
        <p className="text-white/90 text-[11px] font-semibold uppercase tracking-wider mb-0.5">
          {live ? 'Live' : 'Kiosk launch'}
        </p>
        <h2 className="text-white text-lg sm:text-xl font-bold leading-tight truncate">
          {headline}
        </h2>
        <p className="text-white/85 text-xs mt-0.5">{sub}</p>
      </div>
      {preLaunch && (
        <div className="text-right shrink-0">
          <p className="text-white text-3xl sm:text-4xl font-extrabold leading-none">{delta}</p>
          <p className="text-white/85 text-[10px] font-semibold uppercase tracking-wider mt-1">
            {delta === 1 ? 'day' : 'days'} to go
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Milestone tracker ──────────────────────────────────────────────────────

function MilestoneTracker({ milestones, onToggle }) {
  const doneCount = milestones.filter(m => m.status === 'done').length
  const pct       = milestones.length ? Math.round((doneCount / milestones.length) * 100) : 0

  return (
    <div className="bg-white rounded-[14px] border border-gray-100 p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-[#111827]">Launch Milestones</h2>
          <p className="text-[10px] text-gray-400 mt-0.5">Click a circle to mark done · click again to undo</p>
        </div>
        <span className="text-xs text-gray-500 font-medium">
          {doneCount} of {milestones.length} · {pct}%
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {milestones.map((m, i) => {
          const done = m.status === 'done'
          return (
            <div key={m.slug} className="flex-1 flex items-center gap-2 sm:gap-3">
              <div className="flex flex-col items-center gap-1.5 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => onToggle(m.slug)}
                  aria-label={`Toggle ${m.label}`}
                  aria-pressed={done}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/40 cursor-pointer ${
                    done
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                      : 'bg-gray-100 text-gray-400 border-2 border-gray-200 hover:border-[#1D4ED8]/50 hover:text-[#1D4ED8]'
                  }`}
                >
                  {done ? '✓' : i + 1}
                </button>
                <p
                  className={`text-[11px] font-semibold text-center leading-tight ${
                    done ? 'text-[#111827]' : 'text-gray-500'
                  }`}
                >
                  {m.label}
                </p>
              </div>
              {i < milestones.length - 1 && (
                <div className={`h-0.5 flex-1 rounded transition-colors ${done ? 'bg-emerald-400' : 'bg-gray-200'}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Inventory fill ─────────────────────────────────────────────────────────

function InventoryFill({ sold, committedMRR }) {
  const soldPct  = Math.min(100, Math.round((sold / TOTAL_PLACEMENT_SLOTS) * 100))
  const mrrPct   = Math.min(100, Math.round((committedMRR / POTENTIAL_MRR) * 100))
  const remaining = Math.max(0, TOTAL_PLACEMENT_SLOTS - sold)

  return (
    <div className="bg-white rounded-[14px] border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-[#111827]">Ad Inventory — Morgan Hill</h2>
        <Link to="/board" className="text-xs text-[#1D4ED8] hover:underline font-medium">
          Work the pipeline →
        </Link>
      </div>

      {/* Placements sold */}
      <div className="mb-5">
        <div className="flex items-baseline justify-between mb-2">
          <div>
            <span className="text-2xl font-extrabold text-[#111827]">{sold}</span>
            <span className="text-sm text-gray-500 font-medium"> / {TOTAL_PLACEMENT_SLOTS} placements sold</span>
          </div>
          <span className="text-xs font-semibold text-[#1D4ED8]">{soldPct}%</span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1D4ED8] transition-all duration-500"
            style={{ width: `${soldPct}%` }}
          />
        </div>
        <p className="text-[11px] text-gray-500 mt-1.5">
          {remaining} {remaining === 1 ? 'slot' : 'slots'} still open to sell
        </p>
      </div>

      {/* Committed MRR */}
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <div>
            <span className="text-2xl font-extrabold text-[#111827]">{fmt$(committedMRR)}</span>
            <span className="text-sm text-gray-500 font-medium"> / {fmt$(POTENTIAL_MRR)} potential MRR</span>
          </div>
          <span className="text-xs font-semibold text-amber-600">{mrrPct}%</span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 transition-all duration-500"
            style={{ width: `${mrrPct}%` }}
          />
        </div>
        <p className="text-[11px] text-gray-500 mt-1.5">
          Committed monthly revenue from signed + in-flight deals
        </p>
      </div>
    </div>
  )
}

// ─── Today's Focus columns ─────────────────────────────────────────────────

function TasksTodayCard({ tasks, loading }) {
  const today = new Date().toISOString().slice(0, 10)
  const dueToday = tasks.filter(t => t.due_date === today && t.status !== 'done')
  const overdue  = tasks.filter(t => t.due_date && t.due_date < today && t.status !== 'done')

  return (
    <div className="bg-white rounded-[14px] border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-[#111827]">Today's Tasks</h2>
        <Link to="/tasks" className="text-xs text-[#1D4ED8] hover:underline font-medium">
          All →
        </Link>
      </div>

      {loading ? (
        <p className="text-xs text-gray-400 italic py-4 text-center">Loading…</p>
      ) : dueToday.length === 0 && overdue.length === 0 ? (
        <p className="text-xs text-gray-400 italic py-4 text-center">
          Nothing due today. Nice.
        </p>
      ) : (
        <div className="space-y-2">
          {overdue.length > 0 && (
            <div className="text-[10px] font-semibold text-rose-600 uppercase tracking-wider mb-1">
              {overdue.length} overdue
            </div>
          )}
          {[...overdue, ...dueToday].slice(0, 5).map(t => (
            <Link
              key={t.id}
              to="/tasks"
              className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${
                overdue.includes(t) ? 'bg-rose-500' : 'bg-[#1D4ED8]'
              }`} />
              <p className="text-xs text-[#111827] leading-snug truncate">{t.title}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function DealsNeedActionCard({ deals, loading }) {
  const today = new Date()
  const in30  = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10)
  const todayStr = today.toISOString().slice(0, 10)

  // Stuck > 7 days in a non-terminal stage
  const stuckThreshold = new Date(Date.now() - 7 * 86_400_000).toISOString()
  const stuck = deals.filter(d =>
    !['closed_won', 'closed_lost'].includes(d.stage) &&
    d.created_at && d.created_at < stuckThreshold
  )
  const renewing = deals.filter(d =>
    d.run_end && d.run_end >= todayStr && d.run_end <= in30
  )

  const combined = [
    ...renewing.map(d => ({ ...d, _reason: 'renewal' })),
    ...stuck.map(d => ({ ...d, _reason: 'stuck' })),
  ].slice(0, 5)

  return (
    <div className="bg-white rounded-[14px] border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-[#111827]">Deals Needing Action</h2>
        <Link to="/board" className="text-xs text-[#1D4ED8] hover:underline font-medium">
          Board →
        </Link>
      </div>

      {loading ? (
        <p className="text-xs text-gray-400 italic py-4 text-center">Loading…</p>
      ) : combined.length === 0 ? (
        <p className="text-xs text-gray-400 italic py-4 text-center">
          Nothing flagged. All deals moving.
        </p>
      ) : (
        <div className="space-y-2">
          {combined.map(d => (
            <Link
              key={d.id}
              to={`/deal/${d.id}`}
              className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${
                d._reason === 'renewal'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}>
                {d._reason === 'renewal' ? 'Renew' : 'Stuck'}
              </span>
              <p className="text-xs text-[#111827] leading-snug truncate flex-1">{d.title}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function RecentActivityCard({ activity, loading }) {
  const list = activity.length ? activity : SAMPLE_ACTIVITY

  return (
    <div className="bg-white rounded-[14px] border border-gray-100 p-4">
      <h2 className="text-sm font-semibold text-[#111827] mb-3">Recent Activity</h2>

      {loading ? (
        <p className="text-xs text-gray-400 italic py-4 text-center">Loading…</p>
      ) : (
        <div className="space-y-2.5">
          {list.slice(0, 5).map(a => (
            <div key={a.id} className="flex gap-2">
              <span className="text-sm leading-none mt-0.5">{ACTIVITY_ICONS[a.type] ?? '📝'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#111827] leading-snug">{a.body}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{fmtActivity(a.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Quick actions ─────────────────────────────────────────────────────────

function QuickActions() {
  const actions = [
    { label: 'New Deal',    to: '/board',    icon: '💼' },
    { label: 'New Task',    to: '/tasks',    icon: '✅' },
    { label: 'New Contact', to: '/contacts', icon: '👤' },
    { label: 'Add Partner', to: '/partners', icon: '🤝' },
  ]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
      {actions.map(a => (
        <Link
          key={a.label}
          to={a.to}
          className="bg-white rounded-[14px] border border-gray-100 hover:border-[#1D4ED8]/30 hover:bg-[#1D4ED8]/5 transition-colors p-3 flex items-center gap-2"
        >
          <span className="text-base">{a.icon}</span>
          <span className="text-xs font-semibold text-[#111827]">+ {a.label}</span>
        </Link>
      ))}
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [deals,      setDeals]      = useState([])
  const [tasks,      setTasks]      = useState([])
  const [activity,   setActivity]   = useState([])
  const [milestones, setMilestones] = useState(DEFAULT_MILESTONES)
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [{ data: d }, { data: t }, { data: a }, { data: m }] = await Promise.all([
          supabase.from('deals').select('id, title, stage, monthly_rate, run_end, placement_type, screen, created_at'),
          supabase.from('tasks').select('id, title, due_date, status').neq('status', 'done'),
          supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(10),
          supabase.from('launch_milestones').select('slug, label, status, sort_order').order('sort_order'),
        ])
        if (d) setDeals(d)
        if (t) setTasks(t)
        if (a) setActivity(a)
        if (m && m.length) setMilestones(m)
      } catch { /* silent — sample/default fallbacks handle it */ }
      setLoading(false)
    }
    load()
  }, [])

  async function toggleMilestone(slug) {
    const current = milestones.find(m => m.slug === slug)
    if (!current) return
    const nextStatus = current.status === 'done' ? 'todo' : 'done'
    // Optimistic UI
    setMilestones(prev => prev.map(m => m.slug === slug ? { ...m, status: nextStatus } : m))
    // Persist (silent-fail if table missing or not connected — matches project pattern)
    try {
      await supabase
        .from('launch_milestones')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('slug', slug)
    } catch { /* ignore */ }
  }

  // Two separate facts, not one: inventory occupied vs. revenue committed.
  // A free launch-cohort top_banner deal really does occupy one of the 60 sellable
  // slots (counts toward "sold") even though it pays $0 (doesn't count toward MRR).
  // Excludes placement types that were never part of the 60 to begin with:
  // community_static_slot (free by design) and side_qr_tile (spine sold out to
  // founding partners, 0 sellable capacity — see rateCard.js).
  const SELLABLE_INVENTORY_TYPES = [
    'top_banner', 'bottom_banner', 'middle_takeover', 'featured_box',
    'search_button', 'primary_wrap', 'featured_event',
  ]
  const occupyingInventory = deals.filter(d =>
    d.placement_type &&
    SELLABLE_INVENTORY_TYPES.includes(d.placement_type) &&
    !['closed_lost'].includes(d.stage)
  )
  const sold         = occupyingInventory.length
  const committedMRR = occupyingInventory.reduce((s, d) => s + (Number(d.monthly_rate) || 0), 0)

  // ─── Trophy badges — computed live from real data, not tracked separately ──
  const DIGITAL_ZONE_TYPES = ['top_banner', 'bottom_banner', 'middle_takeover', 'featured_box', 'search_button']

  function screenFillPct(screen) {
    let booked = 0, max = 0
    DIGITAL_ZONE_TYPES.forEach(type => {
      const cap = MAX_SLOTS[type]?.perScreen || 0
      max += cap
      booked += occupyingInventory.filter(d =>
        d.placement_type === type && (d.screen === screen || d.screen === 'both')
      ).length
    })
    return max ? booked / max : 0
  }

  function isCategoryFull(type) {
    const cap = MAX_SLOTS[type]
    if (!cap) return false
    if (cap.perScreen) {
      const bookedFor = (screen) => occupyingInventory.filter(d =>
        d.placement_type === type && (d.screen === screen || d.screen === 'both')
      ).length
      return bookedFor('screen_1') >= cap.perScreen || bookedFor('screen_2') >= cap.perScreen
    }
    if (cap.total) {
      return occupyingInventory.filter(d => d.placement_type === type).length >= cap.total
    }
    return false
  }

  const trophies = {
    firstSlot:     sold >= 1,
    quarterScreen: screenFillPct('screen_1') >= 0.25 || screenFillPct('screen_2') >= 0.25,
    firstPaying:   committedMRR > 0,
    categoryFull:  SELLABLE_INVENTORY_TYPES.some(isCategoryFull),
  }

  // ─── Milestone celebrations — confetti fires once per threshold, ever ──────
  const MILESTONE_CHECKS = [
    { key: 'sold_1',   earned: sold >= 1,                                         message: 'First slot booked! 🎉' },
    { key: 'sold_25',  earned: sold >= Math.ceil(TOTAL_PLACEMENT_SLOTS * 0.25),    message: 'Quarter of the way to sold out!' },
    { key: 'sold_50',  earned: sold >= Math.ceil(TOTAL_PLACEMENT_SLOTS * 0.5),     message: 'Halfway to fully sold out!' },
    { key: 'sold_100', earned: sold >= TOTAL_PLACEMENT_SLOTS,                      message: 'SOLD OUT — every slot booked!' },
    { key: 'mrr_1',    earned: committedMRR > 0,                                   message: 'First paying advertiser! 💰' },
    { key: 'mrr_1000', earned: committedMRR >= 1000,                               message: '$1,000 in committed monthly revenue!' },
    { key: 'mrr_max',  earned: committedMRR >= POTENTIAL_MRR,                      message: 'Full revenue potential reached!' },
  ]

  const [celebrating,  setCelebrating]  = useState(false)
  const [celebrateMsg, setCelebrateMsg] = useState('Nice work!')

  useEffect(() => {
    if (loading) return
    const STORAGE_KEY = 'mysyde_dashboard_milestones_seen'
    let seen = []
    try { seen = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { /* ignore */ }
    const newlyEarned = MILESTONE_CHECKS.find(m => m.earned && !seen.includes(m.key))
    if (newlyEarned) {
      setCelebrateMsg(newlyEarned.message)
      setCelebrating(true)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen, newlyEarned.key])) } catch { /* ignore */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, sold, committedMRR])

  return (
    <div className="px-4 py-4 max-w-6xl mx-auto">

      {/* Word / quote of the day — stays at the very top */}
      <DailyLine />

      {/* Greeting */}
      <div className="mb-4">
        <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">
          {fmtToday()}
        </p>
        <h1 className="text-xl font-bold text-[#111827] mt-0.5">
          Morning, Marilyn
        </h1>
      </div>

      {/* Launch countdown hero */}
      <LaunchHero />

      {/* Milestones */}
      <MilestoneTracker milestones={milestones} onToggle={toggleMilestone} />

      {/* Trophy badges — real firsts, visible proof of progress */}
      <TrophyBadges trophies={trophies} />

      {/* Inventory + committed MRR */}
      <div className="mb-4">
        <InventoryFill sold={sold} committedMRR={committedMRR} />
      </div>

      {/* Kiosk fill graphic — front + back screens, filling in by real zone */}
      <div className="mb-4">
        <KioskFillGraphic deals={occupyingInventory} />
      </div>

      {/* Today's focus — 3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <TasksTodayCard   tasks={tasks}       loading={loading} />
        <DealsNeedActionCard deals={deals}    loading={loading} />
        <RecentActivityCard  activity={activity} loading={loading} />
      </div>

      {/* Quick actions */}
      <QuickActions />

      {/* Milestone celebration overlay */}
      {celebrating && (
        <>
          <ConfettiBurst onDone={() => setCelebrating(false)} />
          <CelebrateToast message={celebrateMsg} onDone={() => { /* handled by confetti unmount */ }} />
        </>
      )}
    </div>
  )
}
