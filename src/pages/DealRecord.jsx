import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PlacementSelector from '../components/deal/PlacementSelector'
import CreativeTracker from '../components/deal/CreativeTracker'
import CanvaLink       from '../components/deal/CanvaLink'
import ActivityLog     from '../components/deal/ActivityLog'
import RenewalAlert    from '../components/deal/RenewalAlert'
import PartnerTypeTag  from '../components/shared/PartnerTypeTag'
import { isGoogleConnected, requestGoogleToken } from '../lib/googleAuth'
import { fetchGmailThread, parseGmailThreadId } from '../lib/googleCalendar'

const STAGES = ['prospect', 'pitched', 'proposal', 'creative', 'live', 'closed_won', 'closed_lost']

const PLACEMENT_LABELS = {
  top_banner:        'Top Banner',
  bottom_banner:     'Bottom Banner',
  premier_welcome:   'Premier Welcome Screen',
  start_screen:      'Start Screen',
  search_button:     'Search Button',
  primary_wrap:      'Primary Wrap',
  side_wrap:         'Side Wrap',
  featured_event:    'Featured Event',
  map_picture:       'Map Picture',
  map_name_under:    'Map Name (Under)',
  map_name_category: 'Map Name + Category',
  map_bundle:        'Map Bundle',
}

const SCREEN_LABELS = {
  screen_1: 'Screen 1',
  screen_2: 'Screen 2',
  both:     'Both Screens',
}

const INVOICE_STATUSES = ['none', 'deposit_pending', 'paid', 'overdue']
const INVOICE_LABELS = {
  none:            'No Invoice',
  deposit_pending: 'Deposit Pending',
  paid:            'Paid',
  overdue:         'Overdue',
}
const INVOICE_COLORS = {
  none:            'bg-gray-100 text-gray-500',
  deposit_pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  paid:            'bg-green-50 text-green-700 border border-green-200',
  overdue:         'bg-red-50 text-red-600 border border-red-200',
}

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
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting]           = useState(false)

  // Close deal workflow
  const [pendingClose, setPendingClose] = useState(null) // 'closed_won' | 'closed_lost'
  const [closeDate, setCloseDate]       = useState('')

  // Payment link
  const [paymentLink,      setPaymentLink]      = useState('')
  const [generatingLink,   setGeneratingLink]   = useState(false)
  const [linkCopied,       setLinkCopied]       = useState(false)
  const [linkError,        setLinkError]        = useState('')
  const [proposalOpen,   setProposalOpen]   = useState(false)
  const [proposalCopied, setProposalCopied] = useState(false)
  const [gmailId,       setGmailId]       = useState('')
  const [gmailSaved,    setGmailSaved]    = useState(false)
  const [gmailThread,   setGmailThread]   = useState(null)
  const [gmailLoading,  setGmailLoading]  = useState(false)
  const [gcalConn,      setGcalConn]      = useState(isGoogleConnected())

  // Invoice status
  const [invoiceStatus,     setInvoiceStatus]     = useState('none')
  const [invoiceDropOpen,   setInvoiceDropOpen]   = useState(false)

  // Inline editing
  const [editingTitle,  setEditingTitle]  = useState(false)
  const [titleDraft,    setTitleDraft]    = useState('')
  const [editingDates,  setEditingDates]  = useState(false)
  const [runStart,      setRunStart]      = useState('')
  const [runEnd,        setRunEnd]        = useState('')
  const [notesDraft,    setNotesDraft]    = useState('')
  const [notesSaved,    setNotesSaved]    = useState(false)

  useEffect(() => {
    if (id?.startsWith('sample-')) {
      const d = { ...SAMPLE_DEAL, id }
      setDeal(d)
      setGmailId(d.gmail_thread_id ?? '')
      setNotesDraft(d.notes ?? '')
      setRunStart(d.run_start ?? '')
      setRunEnd(d.run_end ?? '')
      setInvoiceStatus(d.invoice_status ?? 'none')
      setPaymentLink(d.stripe_payment_link ?? '')
      setLoading(false)
      return
    }

    async function load() {
      const { data } = await supabase
        .from('deals')
        .select('*, partners(id, name, type), contacts(name, email)')
        .eq('id', id)
        .single()
      if (data) {
        setDeal(data)
        setGmailId(data.gmail_thread_id ?? '')
        setNotesDraft(data.notes ?? '')
        setRunStart(data.run_start ?? '')
        setRunEnd(data.run_end ?? '')
        setInvoiceStatus(data.invoice_status ?? 'none')
        setPaymentLink(data.stripe_payment_link ?? '')
      }
      setLoading(false)
    }
    load()
  }, [id])

  function handleUpdate(patch) {
    setDeal(prev => prev ? { ...prev, ...patch } : prev)
  }

  async function changeInvoiceStatus(status) {
    setInvoiceDropOpen(false)
    setInvoiceStatus(status)
    await supabase.from('deals').update({ invoice_status: status }).eq('id', deal.id)
    await supabase.from('activity_log').insert({
      type:       'note',
      body:       `Invoice status → ${INVOICE_LABELS[status]}`,
      deal_id:    deal.id,
      partner_id: deal.partner_id ?? null,
    })
  }

  async function changeStage(stage) {
    setStageOpen(false)
    if (stage === 'closed_won' || stage === 'closed_lost') {
      setCloseDate(new Date().toISOString().split('T')[0])
      setPendingClose(stage)
      return
    }
    setDeal(prev => ({ ...prev, stage }))
    await supabase.from('deals').update({ stage }).eq('id', deal.id)
    await supabase.from('activity_log').insert({
      type:       'stage_change',
      body:       `Stage changed to ${STAGE_LABELS[stage]}`,
      deal_id:    deal.id,
      partner_id: deal.partner_id ?? null,
    })
  }

  async function confirmClose() {
    const stage    = pendingClose
    const closedAt = closeDate ? new Date(closeDate + 'T12:00:00').toISOString() : new Date().toISOString()
    setPendingClose(null)
    setDeal(prev => ({ ...prev, stage }))
    await supabase.from('deals').update({ stage, closed_at: closedAt }).eq('id', deal.id)
    await supabase.from('activity_log').insert({
      type:       'stage_change',
      body:       `Deal ${stage === 'closed_won' ? 'closed — Won' : 'closed — Lost'} · ${closeDate}`,
      deal_id:    deal.id,
      partner_id: deal.partner_id ?? null,
    })
  }

  async function saveGmailThread() {
    const parsed = parseGmailThreadId(gmailId)
    await supabase.from('deals').update({ gmail_thread_id: parsed }).eq('id', deal.id)
    // Log as activity
    await supabase.from('activity_log').insert({
      type:       'gmail_linked',
      body:       `Gmail thread linked`,
      deal_id:    deal.id,
      partner_id: deal.partner_id ?? null,
    })
    setGmailSaved(true)
    setTimeout(() => setGmailSaved(false), 2500)
    // Auto-fetch thread details if Google is connected
    if (gcalConn && parsed) fetchThread(parsed)
  }

  async function fetchThread(threadId) {
    setGmailLoading(true)
    const details = await fetchGmailThread(threadId)
    setGmailThread(details)
    setGmailLoading(false)
  }

  async function connectGoogleAndFetch() {
    try {
      await requestGoogleToken()
      setGcalConn(true)
      const parsed = parseGmailThreadId(gmailId || deal.gmail_thread_id)
      if (parsed) fetchThread(parsed)
    } catch (e) { console.warn('Google auth failed', e) }
  }

  async function generatePaymentLink() {
    setGeneratingLink(true)
    setLinkError('')
    const { data, error } = await supabase.functions.invoke('stripe-payment-link', {
      body: { amount: deal.total_value, title: deal.title },
    })
    setGeneratingLink(false)
    if (error || data?.error) {
      setLinkError(data?.error ?? 'Could not generate link — check that the Edge Function is deployed and STRIPE_SECRET_KEY is set.')
      return
    }
    setPaymentLink(data.url)
    await supabase.from('deals').update({ stripe_payment_link: data.url }).eq('id', deal.id)
    await supabase.from('activity_log').insert({
      type: 'note', body: 'Stripe payment link generated', deal_id: deal.id, partner_id: deal.partner_id ?? null,
    })
  }

  async function copyLink() {
    await navigator.clipboard.writeText(paymentLink).catch(() => null)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  function buildProposalEmail() {
    const fmt     = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
    const fmtDate = d => d ? new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null

    const partnerName = deal.partners?.name ?? 'your organization'
    const contactName = deal.contacts?.name?.split(' ')[0] ?? partnerName
    const placement   = PLACEMENT_LABELS[deal.placement_type] ?? deal.placement_type ?? null
    const screen      = deal.screen ? SCREEN_LABELS[deal.screen] : null
    const rate        = deal.monthly_rate ? fmt(deal.monthly_rate) : null
    const total       = deal.total_value  ? fmt(deal.total_value)  : null
    const months      = deal.months
    const startDate   = fmtDate(deal.run_start)
    const endDate     = fmtDate(deal.run_end)

    const lines = [
      `Subject: MySyde Kiosk Ad Proposal — ${partnerName}`,
      '',
      `Hi ${contactName},`,
      '',
      `It was great connecting with you! I'm following up with a formal proposal for ${partnerName}'s advertising placement through MySyde Connect.`,
      '',
      'Here are the details for your package:',
      '',
      ...(placement ? [`Placement: ${placement}${screen ? ` · ${screen}` : ''}`] : []),
      ...(rate      ? [`Monthly Rate: ${rate}/mo`] : []),
      ...(months    ? [`Campaign Length: ${months} month${months === 1 ? '' : 's'}`] : []),
      ...(total     ? [`Total Investment: ${total}`] : []),
      ...(startDate ? [`Campaign Dates: ${startDate}${endDate ? ` – ${endDate}` : ''}`] : []),
      '',
      ...(paymentLink
        ? [
            'To secure your spot, you can pay securely online here:',
            paymentLink,
            '',
            "Once payment is received, we'll get the creative process started and have your ad live on schedule.",
          ]
        : ["To move forward, I'll send over a payment link to secure your spot."]),
      '',
      'Happy to hop on a quick call if you have any questions — just reply here and we\'ll set something up.',
      '',
      'Looking forward to working together!',
      '',
      'Warmly,',
      'Marilyn',
      'MySyde Connect',
    ]

    return lines.join('\n')
  }

  async function deleteDeal() {
    if (deal.id?.startsWith('sample-')) { navigate('/board'); return }
    setDeleting(true)
    await supabase.from('deals').delete().eq('id', deal.id)
    navigate('/board')
  }

  async function saveTitle() {
    const trimmed = titleDraft.trim()
    if (!trimmed || trimmed === deal.title) { setEditingTitle(false); return }
    setDeal(prev => ({ ...prev, title: trimmed }))
    setEditingTitle(false)
    await supabase.from('deals').update({ title: trimmed }).eq('id', deal.id)
  }

  async function saveDates() {
    setEditingDates(false)
    setDeal(prev => ({ ...prev, run_start: runStart || null, run_end: runEnd || null }))
    await supabase.from('deals').update({
      run_start: runStart || null,
      run_end:   runEnd || null,
    }).eq('id', deal.id)
  }

  async function saveNotes() {
    await supabase.from('deals').update({ notes: notesDraft.trim() || null }).eq('id', deal.id)
    setDeal(prev => ({ ...prev, notes: notesDraft.trim() || null }))
    setNotesSaved(true)
    setTimeout(() => setNotesSaved(false), 2000)
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

      {/* Back nav + delete */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate('/board')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#02348E] transition-colors"
          style={{ fontFamily: 'Roboto, sans-serif' }}
        >
          ← Sales Pipeline
        </button>

        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500" style={{ fontFamily: 'Roboto, sans-serif' }}>Delete this deal?</span>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded"
              style={{ fontFamily: 'Roboto, sans-serif' }}
            >
              Cancel
            </button>
            <button
              onClick={deleteDeal}
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
            Delete deal
          </button>
        )}
      </div>

      {/* Renewal alert */}
      <RenewalAlert deal={deal} />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1 min-w-0">
          {editingTitle ? (
            <div className="flex items-center gap-2 mb-2">
              <input
                autoFocus
                type="text"
                value={titleDraft}
                onChange={e => setTitleDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditingTitle(false) }}
                onBlur={saveTitle}
                className="flex-1 text-2xl font-semibold text-[#010100] border-b-2 border-[#02348E] bg-transparent focus:outline-none leading-snug"
                style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
              />
            </div>
          ) : (
            <div className="flex items-start gap-2 mb-2 group">
              <h1
                className="text-2xl font-semibold text-[#010100] leading-snug"
                style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
              >
                {deal.title}
              </h1>
              <button
                onClick={() => { setTitleDraft(deal.title); setEditingTitle(true) }}
                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-[#02348E] text-sm mt-1.5 transition-all shrink-0"
                title="Edit title"
              >
                ✎
              </button>
            </div>
          )}

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

            {/* Invoice status badge */}
            <div className="relative">
              <button
                onClick={() => setInvoiceDropOpen(o => !o)}
                className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide transition-opacity hover:opacity-80 ${
                  INVOICE_COLORS[invoiceStatus] ?? INVOICE_COLORS.none
                }`}
                style={{ fontFamily: 'Roboto, sans-serif' }}
              >
                💳 {INVOICE_LABELS[invoiceStatus]} ▾
              </button>
              {invoiceDropOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setInvoiceDropOpen(false)} />
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[160px] py-1 overflow-hidden">
                    {INVOICE_STATUSES.map(s => (
                      <button
                        key={s}
                        onClick={() => changeInvoiceStatus(s)}
                        className={`block w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${
                          invoiceStatus === s ? 'font-semibold text-[#02348E]' : 'text-[#010100]'
                        }`}
                        style={{ fontFamily: 'Roboto, sans-serif' }}
                      >
                        {INVOICE_LABELS[s]}
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
        <div className="text-right shrink-0">
          {editingDates ? (
            <div className="flex flex-col gap-1.5 items-end">
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={runStart}
                  onChange={e => setRunStart(e.target.value)}
                  className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-[#02348E]"
                  style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
                />
                <span className="text-xs text-gray-400">→</span>
                <input
                  type="date"
                  value={runEnd}
                  onChange={e => setRunEnd(e.target.value)}
                  className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-[#02348E]"
                  style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
                />
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => setEditingDates(false)} className="text-[10px] text-gray-400 hover:text-gray-600" style={{ fontFamily: 'Roboto, sans-serif' }}>Cancel</button>
                <button onClick={saveDates} className="text-[10px] text-[#02348E] font-semibold hover:underline" style={{ fontFamily: 'Roboto, sans-serif' }}>Save</button>
              </div>
            </div>
          ) : (
            <div className="group">
              <p
                className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5"
                style={{ fontFamily: 'Roboto, sans-serif' }}
              >
                Run dates
                <button
                  onClick={() => setEditingDates(true)}
                  className="ml-1.5 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-[#02348E] transition-all"
                  title="Edit dates"
                >
                  ✎
                </button>
              </p>
              <p
                className="text-sm text-[#010100]"
                style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
              >
                {deal.run_start ? `${deal.run_start} → ${deal.run_end ?? '—'}` : (
                  <button
                    onClick={() => setEditingDates(true)}
                    className="text-xs text-gray-400 hover:text-[#02348E] italic"
                    style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
                  >
                    + Set run dates
                  </button>
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Two-column body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Left: main sections */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <PlacementSelector deal={deal} onUpdate={handleUpdate} />
          <CreativeTracker deal={deal} onUpdate={handleUpdate} />
          <CanvaLink       deal={deal} onUpdate={handleUpdate} />

          {/* Payment link */}
          <div className="bg-white rounded-lg border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-1">
              <h3
                className="text-sm font-semibold text-[#010100]"
                style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
              >
                Payment Link
              </h3>
              {deal.total_value > 0 && (
                <span
                  className="text-xs text-gray-400"
                  style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
                >
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(deal.total_value)}
                </span>
              )}
            </div>
            <p
              className="text-xs text-gray-400 mb-3"
              style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
            >
              Generate a Stripe payment link to include in your proposal email.
            </p>

            {paymentLink ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-lg">
                  <a
                    href={paymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-xs text-[#02348E] hover:underline truncate"
                    style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
                  >
                    {paymentLink}
                  </a>
                  <button
                    onClick={copyLink}
                    className="text-xs font-medium text-white bg-[#02348E] hover:bg-[#02348E]/90 px-3 py-1 rounded shrink-0 transition-colors"
                    style={{ fontFamily: 'Roboto, sans-serif' }}
                  >
                    {linkCopied ? 'Copied ✓' : 'Copy'}
                  </button>
                </div>
                <button
                  onClick={generatePaymentLink}
                  disabled={generatingLink || !deal.total_value}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  style={{ fontFamily: 'Roboto, sans-serif' }}
                >
                  {generatingLink ? 'Generating…' : 'Regenerate link'}
                </button>
              </div>
            ) : (
              <button
                onClick={generatePaymentLink}
                disabled={generatingLink || !deal.total_value}
                className="w-full text-sm font-medium text-white bg-[#02348E] hover:bg-[#02348E]/90 disabled:opacity-40 px-4 py-2 rounded transition-colors"
                style={{ fontFamily: 'Roboto, sans-serif' }}
              >
                {generatingLink ? 'Generating…' : deal.total_value ? 'Generate Payment Link' : 'Set a deal total first'}
              </button>
            )}

            {linkError && (
              <p className="text-xs text-red-500 mt-2" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                {linkError}
              </p>
            )}
          </div>

          {/* Proposal Email */}
          <div className="bg-white rounded-lg border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-1">
              <h3
                className="text-sm font-semibold text-[#010100]"
                style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
              >
                Proposal Email
              </h3>
            </div>
            <p
              className="text-xs text-gray-400 mb-3"
              style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
            >
              Generate a ready-to-send proposal email with deal details{paymentLink ? ' and payment link' : ''}.
            </p>
            <button
              onClick={() => setProposalOpen(true)}
              className="w-full text-sm font-medium text-[#02348E] border border-[#02348E] hover:bg-[#02348E] hover:text-white px-4 py-2 rounded transition-colors"
              style={{ fontFamily: 'Roboto, sans-serif' }}
            >
              Draft Proposal Email
            </button>
          </div>

          {/* Gmail thread */}
          <div className="bg-white rounded-lg border border-gray-100 p-4">
            <h3
              className="text-sm font-semibold text-[#010100] mb-3"
              style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
            >
              Gmail Thread
            </h3>

            {/* Linked thread card */}
            {deal.gmail_thread_id && (
              <div className="mb-3 p-3 bg-[#02348E]/5 rounded-lg border border-[#02348E]/15">
                {gmailLoading ? (
                  <p className="text-xs text-gray-400" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                    Loading thread…
                  </p>
                ) : gmailThread ? (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[#010100]" style={{ fontFamily: 'Roboto, sans-serif' }}>
                      {gmailThread.subject}
                    </p>
                    <p className="text-[10px] text-gray-500" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                      {gmailThread.messageCount} messages · {gmailThread.participants} participants · Last: {gmailThread.lastDate}
                    </p>
                    <a
                      href={`https://mail.google.com/mail/u/0/#all/${deal.gmail_thread_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-[#02348E] hover:underline"
                      style={{ fontFamily: 'Roboto, sans-serif' }}
                    >
                      Open in Gmail ↗
                    </a>
                  </div>
                ) : gcalConn ? (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                      Thread ID: <span className="font-mono">{deal.gmail_thread_id}</span>
                    </p>
                    <button
                      onClick={() => fetchThread(deal.gmail_thread_id)}
                      className="text-[10px] text-[#02348E] hover:underline"
                      style={{ fontFamily: 'Roboto, sans-serif' }}
                    >
                      Load details
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-gray-500" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                      Thread linked · Connect Google to see details
                    </p>
                    <button
                      onClick={connectGoogleAndFetch}
                      className="text-[10px] text-[#02348E] hover:underline shrink-0"
                      style={{ fontFamily: 'Roboto, sans-serif' }}
                    >
                      Connect Google
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Input row */}
            <div className="flex gap-2">
              <input
                type="text"
                value={gmailId}
                onChange={e => setGmailId(e.target.value)}
                placeholder={deal.gmail_thread_id ? 'Paste new thread ID or URL…' : 'Paste Gmail thread ID or URL…'}
                className="flex-1 text-sm border border-gray-200 rounded px-3 py-2 focus:outline-none focus:border-[#02348E] text-[#010100]"
                style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
              />
              <button
                onClick={saveGmailThread}
                disabled={!gmailId.trim()}
                className="bg-[#02348E] hover:bg-[#02348E]/90 disabled:opacity-40 text-white text-sm font-medium px-3 py-1.5 rounded transition-colors shrink-0"
                style={{ fontFamily: 'Roboto, sans-serif' }}
              >
                {gmailSaved ? 'Saved ✓' : 'Link'}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
              Paste the thread URL from Gmail or the 16-character thread ID
            </p>
          </div>
          {/* Notes */}
          <div className="bg-white rounded-lg border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3
                className="text-sm font-semibold text-[#010100]"
                style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
              >
                Notes
              </h3>
              {notesSaved && (
                <span className="text-[10px] text-green-500" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                  Saved ✓
                </span>
              )}
            </div>
            <textarea
              value={notesDraft}
              onChange={e => setNotesDraft(e.target.value)}
              rows={4}
              placeholder="Internal notes, context, follow-up reminders…"
              className="w-full text-sm border border-gray-200 rounded px-3 py-2 focus:outline-none focus:border-[#02348E] text-[#010100] resize-none"
              style={{ fontFamily: 'Roboto, sans-serif' }}
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={saveNotes}
                className="text-xs text-[#02348E] hover:underline font-medium"
                style={{ fontFamily: 'Roboto, sans-serif' }}
              >
                Save notes
              </button>
            </div>
          </div>
        </div>

        {/* Right: activity log */}
        <div className="lg:col-span-1">
          <ActivityLog deal={deal} />
        </div>
      </div>

      {/* Proposal email modal */}
      {proposalOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setProposalOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 flex flex-col" style={{ maxHeight: '85vh' }}>
              <div className="flex items-center justify-between mb-4">
                <h2
                  className="text-lg font-semibold text-[#010100]"
                  style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
                >
                  Proposal Email
                </h2>
                <button
                  onClick={() => setProposalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              <pre
                className="flex-1 overflow-y-auto text-sm text-[#010100] bg-[#F2F3F7] rounded-lg p-4 whitespace-pre-wrap leading-relaxed"
                style={{ fontFamily: 'Roboto, sans-serif' }}
              >
                {buildProposalEmail()}
              </pre>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setProposalOpen(false)}
                  className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded"
                  style={{ fontFamily: 'Roboto, sans-serif' }}
                >
                  Close
                </button>
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(buildProposalEmail()).catch(() => null)
                    setProposalCopied(true)
                    setTimeout(() => setProposalCopied(false), 2000)
                  }}
                  className="text-sm font-medium text-white bg-[#02348E] hover:bg-[#02348E]/90 px-4 py-2 rounded transition-colors"
                  style={{ fontFamily: 'Roboto, sans-serif' }}
                >
                  {proposalCopied ? 'Copied ✓' : 'Copy to Clipboard'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Close deal modal */}
      {pendingClose && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setPendingClose(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
              <h2
                className="text-lg font-semibold text-[#010100] mb-1"
                style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
              >
                {pendingClose === 'closed_won' ? '🏆 Close as Won' : '❌ Close as Lost'}
              </h2>
              <p
                className="text-sm text-gray-500 mb-5"
                style={{ fontFamily: 'Roboto, sans-serif' }}
              >
                {pendingClose === 'closed_won'
                  ? 'Great work! Record the date this deal was won.'
                  : 'Record the date this deal was marked as lost.'}
              </p>

              <label
                className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1.5"
                style={{ fontFamily: 'Roboto, sans-serif' }}
              >
                Closed date
              </label>
              <input
                type="date"
                value={closeDate}
                onChange={e => setCloseDate(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded px-3 py-2 focus:outline-none focus:border-[#02348E] text-[#010100] mb-5"
                style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
              />

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setPendingClose(null)}
                  className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded transition-colors"
                  style={{ fontFamily: 'Roboto, sans-serif' }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmClose}
                  className={`text-sm font-medium text-white px-4 py-2 rounded transition-colors ${
                    pendingClose === 'closed_won'
                      ? 'bg-[#02348E] hover:bg-[#02348E]/90'
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                  style={{ fontFamily: 'Roboto, sans-serif' }}
                >
                  {pendingClose === 'closed_won' ? 'Mark as Won' : 'Mark as Lost'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
