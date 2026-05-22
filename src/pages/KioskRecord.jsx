import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PartnerTypeTag from '../components/shared/PartnerTypeTag'

// ─── Sample data ─────────────────────────────────────────────────────────────

const SAMPLE_KIOSKS = {
  'kiosk-1': {
    id: 'kiosk-1',
    name: 'Kiosk 01 — Town Clock Plaza',
    location: 'Monterey Rd & Main Ave, Morgan Hill',
    status: 'active',
    installed_at: '2026-03-15',
    notes: 'High foot traffic location near the historic clock. Screen faces east toward the parking lot.',
    partners: { id: 'sp-1', name: 'MH Chamber', type: 'chamber' },
    deals: [
      { id: 'sd-1', title: 'Spring Ad Campaign — Banner Slot',  stage: 'live',     monthly_rate: 299, months: 3  },
      { id: 'sd-2', title: 'Event Sponsorship — Full Panel',    stage: 'creative',  monthly_rate: 499, months: 3  },
      { id: 'sd-3', title: 'Welcome Screen — Premier Slot',     stage: 'proposal',  monthly_rate: 749, months: 6  },
    ],
  },
  'kiosk-2': {
    id: 'kiosk-2',
    name: 'Kiosk 02 — Civic Center',
    location: '17575 Peak Ave, Morgan Hill',
    status: 'active',
    installed_at: '2026-03-22',
    notes: 'Government complex — strong civic partner opportunity. Large screen visible from parking.',
    partners: { id: 'sp-3', name: 'City of MH', type: 'city_gov' },
    deals: [
      { id: 'sd-4', title: 'City Services Banner',              stage: 'live',    monthly_rate: 299, months: 12 },
      { id: 'sd-5', title: 'Community Events Feature Slot',     stage: 'pitched', monthly_rate: 499, months: 3  },
    ],
  },
  'kiosk-3': {
    id: 'kiosk-3',
    name: 'Kiosk 03 — Depot Courtyard',
    location: '17 Railroad Ave, Morgan Hill',
    status: 'active',
    installed_at: '2026-04-05',
    notes: 'Busy courtyard venue — farmers market foot traffic on weekends.',
    partners: { id: 'sp-2', name: 'Downtown MH', type: 'downtown_assoc' },
    deals: [
      { id: 'sd-6', title: 'Farmers Market Banner',             stage: 'live',       monthly_rate: 299, months: 3 },
      { id: 'sd-7', title: 'Restaurant Row Feature',            stage: 'creative',   monthly_rate: 499, months: 3 },
      { id: 'sd-8', title: 'Downtown Events Map Sponsor',       stage: 'proposal',   monthly_rate: 349, months: 6 },
      { id: 'sd-9', title: 'Holiday Campaign — Full Screen',    stage: 'prospect',   monthly_rate: 799, months: 2 },
    ],
  },
  'kiosk-4': {
    id: 'kiosk-4',
    name: 'Kiosk 04 — Community Center',
    location: '15970 Murphy Ave, Morgan Hill',
    status: 'pending',
    installed_at: null,
    notes: 'Install scheduled for late June. Permit approved. Awaiting final site prep.',
    partners: { id: 'sp-2', name: 'Downtown MH', type: 'downtown_assoc' },
    deals: [],
  },
  'kiosk-5': {
    id: 'kiosk-5',
    name: 'Kiosk 05 — Tennant Station',
    location: 'Tennant Ave & Monterey Rd, Morgan Hill',
    status: 'inactive',
    installed_at: '2026-01-10',
    notes: 'Offline for hardware maintenance. Estimated back online July 2026.',
    partners: null,
    deals: [
      { id: 'sd-10', title: 'Transit Hub Banner', stage: 'closed_won', monthly_rate: 299, months: 3 },
    ],
  },
}

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

const STAGE_LABELS = {
  prospect: 'Prospect', pitched: 'Pitched', proposal: 'Proposal',
  creative: 'Creative', live: 'Live', closed_won: 'Won', closed_lost: 'Lost',
}
const STAGE_COLORS = {
  prospect:    'bg-gray-100 text-gray-600',
  pitched:     'bg-blue-100 text-blue-700',
  proposal:    'bg-purple-100 text-purple-700',
  creative:    'bg-orange-100 text-orange-700',
  live:        'bg-green-100 text-green-700',
  closed_won:  'bg-[#02348E] text-white',
  closed_lost: 'bg-red-100 text-red-600',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const inputCls = 'w-full text-sm border border-gray-200 rounded px-3 py-1.5 focus:outline-none focus:border-[#02348E] text-[#010100] bg-white'

export default function KioskRecord() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const [kiosk,     setKiosk]   = useState(null)
  const [deals,     setDeals]   = useState([])
  const [loading,   setLoading] = useState(true)
  const [notes,     setNotes]   = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [notesSaved,  setNotesSaved]  = useState(false)
  const [partners,    setPartners]    = useState([])

  // Detail editing
  const [editingInfo, setEditingInfo] = useState(false)
  const [infoForm,    setInfoForm]    = useState({ name: '', location: '', status: 'pending', installed_at: '', partner_id: '' })
  const [savingInfo,  setSavingInfo]  = useState(false)

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting]           = useState(false)

  useEffect(() => {
    if (id?.startsWith('kiosk-')) {
      const k = SAMPLE_KIOSKS[id]
      if (k) {
        setKiosk(k)
        setDeals(k.deals ?? [])
        setNotes(k.notes ?? '')
        setInfoForm({ name: k.name, location: k.location ?? '', status: k.status, installed_at: k.installed_at ?? '', partner_id: k.partners?.id ?? '' })
      }
      setLoading(false)
      return
    }

    async function load() {
      try {
        const [{ data: k }, { data: d }, { data: pData }] = await Promise.all([
          supabase.from('kiosks').select('*, partners(id, name, type)').eq('id', id).single(),
          supabase.from('deals').select('id, title, stage, monthly_rate, months').eq('kiosk_id', id).order('created_at', { ascending: false }),
          supabase.from('partners').select('id, name').eq('active', true).order('name'),
        ])
        if (k) {
          setKiosk(k)
          setNotes(k.notes ?? '')
          setInfoForm({ name: k.name, location: k.location ?? '', status: k.status, installed_at: k.installed_at ?? '', partner_id: k.partner_id ?? '' })
        }
        if (d) setDeals(d)
        if (pData) setPartners(pData)
      } catch { /* nothing */ }
      setLoading(false)
    }
    load()
  }, [id])

  async function deleteKiosk() {
    if (id?.startsWith('kiosk-')) { navigate('/kiosks'); return }
    setDeleting(true)
    await supabase.from('kiosks').delete().eq('id', id)
    navigate('/kiosks')
  }

  async function saveInfo() {
    setSavingInfo(true)
    const payload = {
      name:         infoForm.name.trim(),
      location:     infoForm.location.trim() || null,
      status:       infoForm.status,
      installed_at: infoForm.installed_at || null,
      partner_id:   infoForm.partner_id || null,
    }
    await supabase.from('kiosks').update(payload).eq('id', id)
    setKiosk(prev => ({ ...prev, ...payload }))
    setSavingInfo(false)
    setEditingInfo(false)
  }

  async function saveNotes() {
    setSavingNotes(true)
    await supabase.from('kiosks').update({ notes }).eq('id', id)
    setSavingNotes(false)
    setNotesSaved(true)
    setTimeout(() => setNotesSaved(false), 2500)
  }

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-400" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
        Loading…
      </div>
    )
  }

  if (!kiosk) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500 mb-2" style={{ fontFamily: 'Roboto, sans-serif' }}>
          Kiosk not found.
        </p>
        <button onClick={() => navigate('/kiosks')} className="text-sm text-[#02348E] hover:underline" style={{ fontFamily: 'Roboto, sans-serif' }}>
          ← Back to Kiosks
        </button>
      </div>
    )
  }

  const liveDeals   = deals.filter(d => d.stage === 'live')
  const activeDeals = deals.filter(d => !['closed_won', 'closed_lost'].includes(d.stage))
  const totalMRR    = liveDeals.reduce((sum, d) => sum + (d.monthly_rate ?? 0), 0)

  return (
    <div className="max-w-5xl mx-auto px-4 py-4">

      {/* Back nav + delete */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate('/kiosks')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#02348E] transition-colors"
          style={{ fontFamily: 'Roboto, sans-serif' }}
        >
          ← Kiosks
        </button>

        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500" style={{ fontFamily: 'Roboto, sans-serif' }}>Delete this kiosk?</span>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded"
              style={{ fontFamily: 'Roboto, sans-serif' }}
            >
              Cancel
            </button>
            <button
              onClick={deleteKiosk}
              disabled={deleting}
              className="text-xs text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 px-3 py-1 rounded transition-colors"
              style={{ fontFamily: 'Roboto, sans-serif' }}
            >
              {deleting ? 'Deleting…' : 'Yes, delete'}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            style={{ fontFamily: 'Roboto, sans-serif' }}
          >
            Delete kiosk
          </button>
        )}
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1
            className="text-2xl font-semibold text-[#010100] mb-2"
            style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
          >
            {kiosk.name}
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={kiosk.status} />
            {kiosk.partners && (
              <>
                <PartnerTypeTag type={kiosk.partners.type} />
                <Link
                  to={`/partner/${kiosk.partners.id}`}
                  className="text-sm text-[#02348E] hover:underline"
                  style={{ fontFamily: 'Roboto, sans-serif' }}
                >
                  {kiosk.partners.name}
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Install date */}
        {kiosk.installed_at && (
          <div className="text-right shrink-0">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5" style={{ fontFamily: 'Roboto, sans-serif' }}>
              Installed
            </p>
            <p className="text-sm text-[#010100]" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
              {new Date(kiosk.installed_at + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        )}
      </div>

      {/* Location */}
      {kiosk.location && (
        <div className="flex items-center gap-2 mb-6 text-sm text-gray-500" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
          <span>📍</span>
          <span>{kiosk.location}</span>
        </div>
      )}

      {/* Edit details panel */}
      {editingInfo ? (
        <div className="bg-white rounded-lg border border-[#02348E]/20 p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#010100]" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>Edit Kiosk Details</h3>
            <div className="flex gap-2">
              <button onClick={() => setEditingInfo(false)} className="text-xs text-gray-400 hover:text-gray-600" style={{ fontFamily: 'Roboto, sans-serif' }}>Cancel</button>
              <button onClick={saveInfo} disabled={savingInfo} className="text-xs font-medium bg-[#02348E] text-white px-3 py-1.5 rounded hover:bg-[#02348E]/90 disabled:opacity-40 transition-colors" style={{ fontFamily: 'Roboto, sans-serif' }}>
                {savingInfo ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1" style={{ fontFamily: 'Roboto, sans-serif' }}>Name</label>
              <input type="text" value={infoForm.name} onChange={e => setInfoForm(p => ({ ...p, name: e.target.value }))} className={inputCls} style={{ fontFamily: 'Roboto, sans-serif' }} />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1" style={{ fontFamily: 'Roboto, sans-serif' }}>Location</label>
              <input type="text" value={infoForm.location} onChange={e => setInfoForm(p => ({ ...p, location: e.target.value }))} className={inputCls} style={{ fontFamily: 'Roboto, sans-serif' }} />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1" style={{ fontFamily: 'Roboto, sans-serif' }}>Status</label>
              <select value={infoForm.status} onChange={e => setInfoForm(p => ({ ...p, status: e.target.value }))} className={inputCls} style={{ fontFamily: 'Roboto, sans-serif' }}>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1" style={{ fontFamily: 'Roboto, sans-serif' }}>Install Date</label>
              <input type="date" value={infoForm.installed_at} onChange={e => setInfoForm(p => ({ ...p, installed_at: e.target.value }))} className={inputCls} style={{ fontFamily: 'Roboto, sans-serif' }} />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1" style={{ fontFamily: 'Roboto, sans-serif' }}>Partner</label>
              <select value={infoForm.partner_id} onChange={e => setInfoForm(p => ({ ...p, partner_id: e.target.value }))} className={inputCls} style={{ fontFamily: 'Roboto, sans-serif' }}>
                <option value="">— No partner —</option>
                {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-end mb-4">
          <button onClick={() => setEditingInfo(true)} className="text-xs text-gray-400 hover:text-[#02348E] border border-gray-200 hover:border-[#02348E] px-3 py-1.5 rounded transition-colors" style={{ fontFamily: 'Roboto, sans-serif' }}>
            ✎ Edit details
          </button>
        </div>
      )}

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Active Ad Slots', value: activeDeals.length, color: 'text-[#02348E]' },
          { label: 'Live Campaigns',  value: liveDeals.length,   color: 'text-green-600' },
          { label: 'Monthly Revenue', value: `$${totalMRR.toLocaleString()}`, color: 'text-[#010100]' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg border border-gray-100 p-4 text-center">
            <p className={`text-2xl font-bold mb-1 ${s.color}`} style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
              {s.value}
            </p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide" style={{ fontFamily: 'Roboto, sans-serif' }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Ad slots / linked deals */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-100 p-4">
            <h3
              className="text-sm font-semibold text-[#010100] mb-3"
              style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
            >
              Ad Slots ({deals.length})
            </h3>

            {deals.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-4 text-center" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                No deals linked to this kiosk yet.
              </p>
            ) : (
              <div className="space-y-2">
                {deals.map(deal => (
                  <Link
                    key={deal.id}
                    to={`/deal/${deal.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-[#02348E]/30 hover:bg-[#02348E]/5 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0 ${
                          STAGE_COLORS[deal.stage] ?? 'bg-gray-100 text-gray-600'
                        }`}
                        style={{ fontFamily: 'Roboto, sans-serif' }}
                      >
                        {STAGE_LABELS[deal.stage] ?? deal.stage}
                      </span>
                      <span
                        className="text-sm text-[#010100] truncate group-hover:text-[#02348E] transition-colors"
                        style={{ fontFamily: 'Roboto, sans-serif' }}
                      >
                        {deal.title}
                      </span>
                    </div>
                    {deal.monthly_rate && (
                      <span
                        className="text-xs text-gray-500 shrink-0 ml-3"
                        style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
                      >
                        ${deal.monthly_rate}/mo × {deal.months ?? '—'} mo
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}

            <Link
              to="/board"
              className="mt-3 inline-flex items-center gap-1 text-xs text-[#02348E] hover:underline"
              style={{ fontFamily: 'Roboto, sans-serif' }}
            >
              + Link a deal from the sales board
            </Link>
          </div>
        </div>

        {/* Notes */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-100 p-4 h-full">
            <h3
              className="text-sm font-semibold text-[#010100] mb-3"
              style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
            >
              Notes
            </h3>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={6}
              placeholder="Install notes, screen orientation, maintenance log…"
              className="w-full text-sm border border-gray-200 rounded px-3 py-2 resize-none focus:outline-none focus:border-[#02348E] text-[#010100]"
              style={{ fontFamily: 'Roboto, sans-serif' }}
            />
            <button
              onClick={saveNotes}
              disabled={savingNotes}
              className="mt-2 bg-[#02348E] hover:bg-[#02348E]/90 disabled:opacity-40 text-white text-xs font-medium px-4 py-1.5 rounded transition-colors"
              style={{ fontFamily: 'Roboto, sans-serif' }}
            >
              {savingNotes ? 'Saving…' : notesSaved ? 'Saved ✓' : 'Save Notes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
