import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PartnerTypeTag from '../components/shared/PartnerTypeTag'
import NewKioskModal from '../components/kiosks/NewKioskModal'
import { exportCsv, todaySlug } from '../lib/csvExport'

// ─── Sample data ─────────────────────────────────────────────────────────────

const SAMPLE_KIOSKS = [
  {
    id: 'kiosk-1',
    name: 'Kiosk 01 — Town Clock Plaza',
    location: 'Monterey Rd & Main Ave, Morgan Hill',
    status: 'active',
    installed_at: '2026-03-15',
    partners: { name: 'MH Chamber', type: 'chamber' },
    deal_count: 3,
  },
  {
    id: 'kiosk-2',
    name: 'Kiosk 02 — Civic Center',
    location: '17575 Peak Ave, Morgan Hill',
    status: 'active',
    installed_at: '2026-03-22',
    partners: { name: 'City of MH', type: 'city_gov' },
    deal_count: 2,
  },
  {
    id: 'kiosk-3',
    name: 'Kiosk 03 — Depot Courtyard',
    location: '17 Railroad Ave, Morgan Hill',
    status: 'active',
    installed_at: '2026-04-05',
    partners: { name: 'Downtown MH', type: 'downtown_assoc' },
    deal_count: 4,
  },
  {
    id: 'kiosk-4',
    name: 'Kiosk 04 — Community Center',
    location: '15970 Murphy Ave, Morgan Hill',
    status: 'pending',
    installed_at: null,
    partners: { name: 'Downtown MH', type: 'downtown_assoc' },
    deal_count: 0,
  },
  {
    id: 'kiosk-5',
    name: 'Kiosk 05 — Tennant Station',
    location: 'Tennant Ave & Monterey Rd, Morgan Hill',
    status: 'inactive',
    installed_at: '2026-01-10',
    partners: null,
    deal_count: 1,
  },
]

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  active:   { label: 'Active',   dot: 'bg-green-500', pill: 'bg-green-50 text-green-700 border-green-200' },
  pending:  { label: 'Pending',  dot: 'bg-amber-400', pill: 'bg-amber-50 text-amber-700 border-amber-200' },
  inactive: { label: 'Inactive', dot: 'bg-gray-300',  pill: 'bg-gray-50 text-gray-500 border-gray-200'   },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.inactive
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.pill}`}
      style={{ fontFamily: 'Roboto, sans-serif' }}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const FILTERS = ['all', 'active', 'pending', 'inactive']

export default function Kiosks() {
  const navigate = useNavigate()
  const [kiosks,  setKiosks]  = useState([])
  const [filter,  setFilter]  = useState('all')
  const [search,  setSearch]  = useState('')
  const [loading, setLoading] = useState(true)
  const [showNewKiosk, setShowNewKiosk] = useState(false)

  function handleKioskCreated(newKiosk) {
    setKiosks(prev => [...prev, newKiosk].sort((a, b) => a.name.localeCompare(b.name)))
  }

  function handleExport() {
    exportCsv(
      kiosks.map(k => ({ ...k, partner: k.partners?.name ?? '' })),
      ['name', 'location', 'partner', 'status', 'installed_at', 'deal_count'],
      { name: 'Name', location: 'Location', partner: 'Partner', status: 'Status', installed_at: 'Installed', deal_count: 'Deals' },
      `kiosks-${todaySlug()}.csv`
    )
  }

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase
          .from('kiosks')
          .select('*, partners(name, type), deals(id)')
          .order('name')
        if (data) {
          setKiosks(data.map(k => ({ ...k, deal_count: k.deals?.length ?? 0 })))
        }
      } catch { /* ignore */ }
      setLoading(false)
    }
    load()
  }, [])

  const visible = kiosks.filter(k => {
    const matchFilter = filter === 'all' || k.status === filter
    const q = search.toLowerCase()
    const matchSearch = !q
      || k.name.toLowerCase().includes(q)
      || (k.location ?? '').toLowerCase().includes(q)
      || (k.partners?.name ?? '').toLowerCase().includes(q)
    return matchFilter && matchSearch
  })

  const counts = {
    all:      kiosks.length,
    active:   kiosks.filter(k => k.status === 'active').length,
    pending:  kiosks.filter(k => k.status === 'pending').length,
    inactive: kiosks.filter(k => k.status === 'inactive').length,
  }

  return (
    <div className="px-4 py-4">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1
          className="text-xl font-semibold text-[#010100]"
          style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
        >
          Kiosks
        </h1>
        <div className="flex items-center gap-2">
          {loading && (
            <span className="text-xs text-gray-400" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
              Loading…
            </span>
          )}
          <button
            onClick={handleExport}
            className="text-sm text-gray-500 hover:text-[#02348E] border border-gray-200 hover:border-[#02348E] px-3 py-1.5 rounded transition-colors"
            style={{ fontFamily: 'Roboto, sans-serif' }}
          >
            ↓ Export CSV
          </button>
          <button
            onClick={() => setShowNewKiosk(true)}
            className="bg-[#02348E] hover:bg-[#02348E]/90 text-white text-sm font-medium px-3 py-1.5 rounded transition-colors"
            style={{ fontFamily: 'Roboto, sans-serif' }}
          >
            + Add Kiosk
          </button>
        </div>
      </div>

      {/* Search + filter chips */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="Search kiosks…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 rounded px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-[#02348E] w-52"
          style={{ fontFamily: 'Roboto, sans-serif' }}
        />
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                filter === f
                  ? 'bg-[#02348E] text-white'
                  : 'bg-white border border-gray-200 text-gray-500 hover:border-[#02348E] hover:text-[#02348E]'
              }`}
              style={{ fontFamily: 'Roboto, sans-serif' }}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">

        {/* Column headers */}
        <div
          className="grid grid-cols-[2fr_2fr_1.5fr_1fr_1fr_80px] gap-4 px-4 py-2 bg-[#F2F3F7] border-b border-gray-100 text-[10px] font-semibold text-gray-400 uppercase tracking-wide"
          style={{ fontFamily: 'Roboto, sans-serif' }}
        >
          <span>Name</span>
          <span>Location</span>
          <span>Partner</span>
          <span>Status</span>
          <span>Installed</span>
          <span className="text-right">Deals</span>
        </div>

        {visible.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
            No kiosks found.
          </div>
        )}

        {visible.map((kiosk, i) => (
          <div
            key={kiosk.id}
            onClick={() => navigate(`/kiosks/${kiosk.id}`)}
            className={`grid grid-cols-[2fr_2fr_1.5fr_1fr_1fr_80px] gap-4 items-center px-4 py-3 cursor-pointer hover:bg-[#F2F3F7] transition-colors ${
              i > 0 ? 'border-t border-gray-50' : ''
            }`}
          >
            <p
              className="text-sm font-medium text-[#010100] truncate"
              style={{ fontFamily: 'Roboto, sans-serif' }}
            >
              {kiosk.name}
            </p>

            <p
              className="text-xs text-gray-500 truncate"
              style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
            >
              {kiosk.location ?? '—'}
            </p>

            <div>
              {kiosk.partners
                ? <PartnerTypeTag type={kiosk.partners.type} label={kiosk.partners.name} />
                : <span className="text-xs text-gray-300" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>—</span>
              }
            </div>

            <div><StatusBadge status={kiosk.status} /></div>

            <span
              className="text-xs text-gray-500"
              style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
            >
              {kiosk.installed_at
                ? new Date(kiosk.installed_at + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : '—'}
            </span>

            <div className="flex justify-end">
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  (kiosk.deal_count ?? 0) > 0
                    ? 'bg-[#02348E]/10 text-[#02348E]'
                    : 'bg-gray-100 text-gray-400'
                }`}
                style={{ fontFamily: 'Roboto, sans-serif' }}
              >
                {kiosk.deal_count ?? 0}
              </span>
            </div>
          </div>
        ))}
      </div>

      {showNewKiosk && (
        <NewKioskModal
          onClose={() => setShowNewKiosk(false)}
          onCreated={handleKioskCreated}
        />
      )}

      {/* Summary strip */}
      <div className="flex gap-8 mt-5">
        {[
          { label: 'Active',   value: counts.active,   color: 'text-green-600' },
          { label: 'Pending',  value: counts.pending,  color: 'text-amber-600' },
          { label: 'Inactive', value: counts.inactive, color: 'text-gray-400'  },
        ].map(s => (
          <div key={s.label}>
            <p className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
              {s.value}
            </p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide" style={{ fontFamily: 'Roboto, sans-serif' }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
