import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PlacementSelector from '../components/deal/PlacementSelector'
import CreativeTracker from '../components/deal/CreativeTracker'
import CanvaLink       from '../components/deal/CanvaLink'
import ActivityLog     from '../components/deal/ActivityLog'
import RenewalAlert    from '../components/deal/RenewalAlert'
import PartnerTypeTag  from '../components/shared/PartnerTypeTag'

const STAGES = ['prospect', 'pitched', 'proposal', 'creative', 'live', 'closed_won', 'closed_lost']

const STAGE_LABELS = {
  prospect:    'Prospect',
  pitched:     'Pitched',
  proposal:    'Proposal',
  creative:    'Creative',
  live:        'Live',
  closed_won:  'Won',
  closed_lost: 'Lost',
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

const SAMPLE_DEAL = {
  id:              'sample-1',
  title:           'Spring Ad Campaign — Banner Slot',
  stage:           'prospect',
  package:         'starter',
  monthly_rate:    299,
  months:          3,
  total_value:     897,
  design_status:   'none',
  canva_file_url:  null,
  canva_file_name: null,
  gmail_thread_id: null,
  run_start:       '2026-06-01',
  run_end:         '2026-07-25',
  renewal_alert:   '2026-07-11',
  notes:           null,
  partner_id:      'sample-partner-1',
  partners:        { id: 'sample-partner-1', name: 'Morgan Hill Chamber of Commerce', type: 'chamber' },
}

export default function DealRecord() {
  const { id }    = useParams()
  const navigate  = useNavigate()

  const [deal, setDeal]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [stageOpen, setStageOpen] = useState(false)
  const [gmailId, setGmailId]   = useState('')
  const [gmailSaved, setGmailSaved] = useState(false)

  useEffect(() => {
    if (id?.startsWith('sample-')) {
      const d = { ...SAMPLE_DEAL, id }
      setDeal(d)
      setGmailId(d.gmail_thread_id ?? '')
      setLoading(false)
      return
    }

    async function load() {
      const { data } = await supabase
        .from('deals')
        .select('*, partners(id, name, type)')
        .eq('id', id)
        .single()
        .catch(() => ({ data: null }))
      if (data) {
        setDeal(data)
        setGmailId(data.gmail_thread_id ?? '')
      }
      setLoading(false)
    }
    load()
  }, [id])

  function handleUpdate(patch) {
    setDeal(prev => prev ? { ...prev, ...patch } : prev)
  }

  async function changeStage(stage) {
    setStageOpen(false)
    setDeal(prev => ({ ...prev, stage }))
    await supabase.from('deals').update({ stage }).eq('id', deal.id).catch(() => null)
    await supabase.from('activity_log').insert({
      type:       'stage_change',
      body:       `Stage changed to ${STAGE_LABELS[stage]}`,
      deal_id:    deal.id,
      partner_id: deal.partner_id ?? null,
    }).catch(() => null)
  }

  async function saveGmailThread() {
    await supabase.from('deals').update({ gmail_thread_id: gmailId }).eq('id', deal.id).catch(() => null)
    setGmailSaved(true)
    setTimeout(() => setGmailSaved(false), 2500)
  }

  if (loading) {
    return (
      <div
        className="p-6 text-sm text-gray-400"
        style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
      >
        Loading…
      </div>
    )
  }

  if (!deal) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500 mb-2" style={{ fontFamily: 'Roboto, sans-serif' }}>
          Deal not found.
        </p>
        <button
          onClick={() => navigate('/board')}
          className="text-sm text-[#02348E] hover:underline"
          style={{ fontFamily: 'Roboto, sans-serif' }}
        >
          ← Back to board
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-4">

      {/* Back nav */}
      <button
        onClick={() => navigate('/board')}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#02348E] mb-4 transition-colors"
        style={{ fontFamily: 'Roboto, sans-serif' }}
      >
        ← Sales Pipeline
      </button>

      {/* Renewal alert */}
      <RenewalAlert deal={deal} />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <h1
            className="text-2xl font-semibold text-[#010100] mb-2 leading-snug"
            style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
          >
            {deal.title}
          </h1>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Stage badge + dropdown */}
            <div className="relative">
              <button
                onClick={() => setStageOpen(o => !o)}
                className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide transition-opacity hover:opacity-80 ${
                  STAGE_COLORS[deal.stage] ?? 'bg-gray-100 text-gray-600'
                }`}
                style={{ fontFamily: 'Roboto, sans-serif' }}
              >
                {STAGE_LABELS[deal.stage] ?? deal.stage} ▾
              </button>

              {stageOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setStageOpen(false)}
                  />
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[140px] py-1 overflow-hidden">
                    {STAGES.map(s => (
                      <button
                        key={s}
                        onClick={() => changeStage(s)}
                        className={`block w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${
                          deal.stage === s ? 'font-semibold text-[#02348E]' : 'text-[#010100]'
                        }`}
                        style={{ fontFamily: 'Roboto, sans-serif' }}
                      >
                        {STAGE_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Partner */}
            {deal.partners && (
              <>
                <PartnerTypeTag type={deal.partners.type} />
                <Link
                  to={`/partner/${deal.partners.id}`}
                  className="text-sm text-[#02348E] hover:underline"
                  style={{ fontFamily: 'Roboto, sans-serif' }}
                >
                  {deal.partners.name}
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Run dates */}
        {deal.run_start && (
          <div className="text-right shrink-0">
            <p
              className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5"
              style={{ fontFamily: 'Roboto, sans-serif' }}
            >
              Run dates
            </p>
            <p
              className="text-sm text-[#010100]"
              style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
            >
              {deal.run_start} → {deal.run_end ?? '—'}
            </p>
          </div>
        )}
      </div>

      {/* Two-column body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Left: main sections */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <PlacementSelector deal={deal} onUpdate={handleUpdate} />
          <CreativeTracker deal={deal} onUpdate={handleUpdate} />
          <CanvaLink       deal={deal} onUpdate={handleUpdate} />

          {/* Gmail thread */}
          <div className="bg-white rounded-lg border border-gray-100 p-4">
            <h3
              className="text-sm font-semibold text-[#010100] mb-3"
              style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
            >
              Gmail Thread
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={gmailId}
                onChange={e => setGmailId(e.target.value)}
                placeholder="Paste Gmail thread ID…"
                className="flex-1 text-sm border border-gray-200 rounded px-3 py-2 focus:outline-none focus:border-[#02348E] text-[#010100]"
                style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
              />
              <button
                onClick={saveGmailThread}
                className="bg-[#02348E] hover:bg-[#02348E]/90 text-white text-sm font-medium px-3 py-1.5 rounded transition-colors shrink-0"
                style={{ fontFamily: 'Roboto, sans-serif' }}
              >
                {gmailSaved ? 'Saved ✓' : 'Save'}
              </button>
            </div>
            {gmailId && (
              <p
                className="text-xs text-gray-400 mt-2"
                style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
              >
                Gmail sync coming in Phase 5 — thread ID stored for future linking.
              </p>
            )}
          </div>
        </div>

        {/* Right: activity log */}
        <div className="lg:col-span-1">
          <ActivityLog deal={deal} />
        </div>
      </div>
    </div>
  )
}
