import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PartnerTypeTag from '../components/shared/PartnerTypeTag'
import TaskBoard from '../components/tasks/TaskBoard'
import NewTaskModal from '../components/tasks/NewTaskModal'

// ─── Sample data ────────────────────────────────────────────────────────────

const SAMPLE_PARTNERS = {
  'sample-partner-1': {
    id: 'sample-partner-1', name: 'Morgan Hill Chamber of Commerce',
    type: 'chamber', website: 'morganhillchamber.org',
    address: '17000 Monterey Rd, Morgan Hill, CA 95037',
    notes: 'Key partner for the annual business expo. Great relationship with Sarah.',
    active: true,
  },
  'sample-partner-2': {
    id: 'sample-partner-2', name: 'Downtown Morgan Hill',
    type: 'downtown_assoc', website: 'downtownmorganhill.com',
    address: '100 W Main Ave, Morgan Hill, CA 95037',
    notes: 'Focused on foot-traffic campaigns for local businesses.',
    active: true,
  },
  'sample-partner-3': {
    id: 'sample-partner-3', name: 'City of Morgan Hill',
    type: 'city_gov', website: 'morganhill.ca.gov',
    address: '17575 Peak Ave, Morgan Hill, CA 95037',
    notes: 'Civic partnership — strong candidate for full-screen placement.',
    active: true,
  },
}

const SAMPLE_CONTACTS = {
  'sample-partner-1': [
    { id: 'sc-1', name: 'Sarah Kim',    role: 'Executive Director', email: 'sarah@mhchamber.org',   phone: '408-555-0101' },
    { id: 'sc-2', name: 'David Torres', role: 'Events Manager',      email: 'david@mhchamber.org',   phone: '408-555-0102' },
  ],
  'sample-partner-2': [
    { id: 'sc-3', name: 'Priya Mehta',  role: 'Marketing Lead',      email: 'priya@downtownmh.com',  phone: '408-555-0201' },
  ],
  'sample-partner-3': [
    { id: 'sc-4', name: 'James Ortega', role: 'City Communications',  email: 'jortega@morganhill.gov', phone: '408-555-0301' },
  ],
}

const SAMPLE_DEALS_MAP = {
  'sample-partner-1': [
    { id: 'sample-1', title: 'Spring Ad Campaign — Banner Slot', stage: 'prospect', package: 'starter', monthly_rate: 299, months: 3, total_value: 897 },
  ],
  'sample-partner-2': [
    { id: 'sample-2', title: 'Full Panel Ad — Downtown Feature', stage: 'proposal', package: 'standard', monthly_rate: 499, months: 3, total_value: 1497 },
  ],
  'sample-partner-3': [
    { id: 'sample-3', title: 'Full Screen Premium Placement', stage: 'live', package: 'premium', monthly_rate: 799, months: 3, total_value: 2397 },
  ],
}

const SAMPLE_TASKS_MAP = {
  'sample-partner-1': [
    { id: 'st-1', title: 'Send proposal deck',    status: 'todo',        priority: 'high'   },
    { id: 'st-2', title: 'Follow up on invoice',  status: 'in_progress', priority: 'medium' },
    { id: 'st-3', title: 'Review creative brief', status: 'review',      priority: 'medium' },
    { id: 'st-4', title: 'Onboarding call',       status: 'done',        priority: 'low'    },
  ],
}

// ─── Constants ──────────────────────────────────────────────────────────────

const TABS = ['Overview', 'Deals', 'Tasks', 'Notes']

const STAGE_LABELS = {
  prospect: 'Prospect', pitched: 'Pitched', proposal: 'Proposal',
  creative: 'Creative', live: 'Live', closed_won: 'Won', closed_lost: 'Lost',
}
const STAGE_COLORS = {
  prospect: 'bg-gray-100 text-gray-600',   pitched:     'bg-blue-100 text-blue-700',
  proposal: 'bg-purple-100 text-purple-700', creative:  'bg-orange-100 text-orange-700',
  live:     'bg-green-100 text-green-700', closed_won:   'bg-[#02348E] text-white',
  closed_lost: 'bg-red-100 text-red-600',
}
const PACKAGE_COLORS = {
  starter: 'bg-gray-100 text-gray-600', standard: 'bg-blue-50 text-[#02348E]', premium: 'bg-yellow-50 text-yellow-700',
}
const PRIORITY_COLORS = {
  high: 'text-red-500', medium: 'text-orange-400', low: 'text-gray-400',
}
const TASK_STATUSES = ['todo', 'in_progress', 'review', 'done']
const TASK_LABELS   = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' }
const TASK_STATUS_NEXT = { todo: 'in_progress', in_progress: 'review', review: 'done', done: 'todo' }

function fmt(v) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)
}

function initials(name) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

// ─── Overview tab ────────────────────────────────────────────────────────────

const PARTNER_TYPES = [
  { value: 'chamber',        label: 'Chamber' },
  { value: 'city_gov',       label: 'City / Gov' },
  { value: 'downtown_assoc', label: 'Downtown' },
  { value: 'community_org',  label: 'Community' },
  { value: 'local_business', label: 'Business' },
  { value: 'nonprofit',      label: 'Nonprofit' },
  { value: 'other',          label: 'Other' },
]

function OverviewTab({ partner, contacts, onPartnerUpdate }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm]       = useState({
    name:    partner.name,
    type:    partner.type,
    website: partner.website ?? '',
    address: partner.address ?? '',
    notes:   partner.notes   ?? '',
    active:  partner.active  ?? true,
  })
  const [saving, setSaving] = useState(false)

  function handleChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function save() {
    setSaving(true)
    await supabase.from('partners').update(form).eq('id', partner.id).catch(() => null)
    setSaving(false)
    setEditing(false)
    onPartnerUpdate?.(form)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Partner details */}
      <div className="lg:col-span-2 bg-white rounded-lg border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3
            className="text-sm font-semibold text-[#010100]"
            style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
          >
            Partner Details
          </h3>
          <button
            onClick={() => editing ? save() : setEditing(true)}
            disabled={saving}
            className={`text-xs font-medium px-3 py-1.5 rounded transition-colors ${
              editing
                ? 'bg-[#02348E] text-white hover:bg-[#02348E]/90'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            style={{ fontFamily: 'Roboto, sans-serif' }}
          >
            {saving ? 'Saving…' : editing ? 'Save' : 'Edit'}
          </button>
        </div>

        <div className="space-y-3">
          {[
            { label: 'Organization', field: 'name',    type: 'text' },
            { label: 'Website',      field: 'website', type: 'url'  },
            { label: 'Address',      field: 'address', type: 'text' },
          ].map(({ label, field, type }) => (
            <div key={field}>
              <label
                className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1"
                style={{ fontFamily: 'Roboto, sans-serif' }}
              >
                {label}
              </label>
              {editing ? (
                <input
                  type={type}
                  value={form[field]}
                  onChange={e => handleChange(field, e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded px-3 py-1.5 focus:outline-none focus:border-[#02348E] text-[#010100]"
                  style={{ fontFamily: 'Roboto, sans-serif' }}
                />
              ) : (
                <p
                  className="text-sm text-[#010100]"
                  style={{ fontFamily: 'Roboto, sans-serif' }}
                >
                  {form[field] || <span className="text-gray-400 italic">Not set</span>}
                </p>
              )}
            </div>
          ))}

          {/* Type + Active (only shown in edit mode) */}
          {editing && (
            <>
              <div>
                <label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1" style={{ fontFamily: 'Roboto, sans-serif' }}>
                  Partner Type
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {PARTNER_TYPES.map(pt => (
                    <button
                      key={pt.value}
                      type="button"
                      onClick={() => handleChange('type', pt.value)}
                      className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
                        form.type === pt.value
                          ? 'bg-[#02348E] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      style={{ fontFamily: 'Roboto, sans-serif' }}
                    >
                      {pt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1" style={{ fontFamily: 'Roboto, sans-serif' }}>
                  Status
                </label>
                <div className="flex gap-2">
                  {[true, false].map(val => (
                    <button
                      key={String(val)}
                      type="button"
                      onClick={() => handleChange('active', val)}
                      className={`text-xs px-3 py-1.5 rounded font-medium border transition-colors ${
                        form.active === val
                          ? val ? 'bg-green-500 text-white border-green-500' : 'bg-gray-400 text-white border-gray-400'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                      }`}
                      style={{ fontFamily: 'Roboto, sans-serif' }}
                    >
                      {val ? 'Active' : 'Inactive'}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <label
              className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1"
              style={{ fontFamily: 'Roboto, sans-serif' }}
            >
              Notes
            </label>
            {editing ? (
              <textarea
                value={form.notes}
                onChange={e => handleChange('notes', e.target.value)}
                rows={3}
                className="w-full text-sm border border-gray-200 rounded px-3 py-1.5 resize-none focus:outline-none focus:border-[#02348E] text-[#010100]"
                style={{ fontFamily: 'Roboto, sans-serif' }}
              />
            ) : (
              <p
                className="text-sm text-[#010100]"
                style={{ fontFamily: 'Roboto, sans-serif' }}
              >
                {form.notes || <span className="text-gray-400 italic">No notes</span>}
              </p>
            )}
          </div>

          {editing && (
            <button
              onClick={() => setEditing(false)}
              className="text-xs text-gray-400 hover:text-gray-600"
              style={{ fontFamily: 'Roboto, sans-serif' }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Contact list */}
      <div className="bg-white rounded-lg border border-gray-100 p-4">
        <h3
          className="text-sm font-semibold text-[#010100] mb-3"
          style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
        >
          Contacts
        </h3>
        <div className="space-y-3">
          {contacts.length === 0 ? (
            <p
              className="text-xs text-gray-400"
              style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
            >
              No contacts yet
            </p>
          ) : contacts.map(c => (
            <div key={c.id} className="flex items-start gap-2.5">
              <div
                className="w-8 h-8 rounded-full bg-[#02348E] text-white text-xs font-semibold flex items-center justify-center shrink-0"
                style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
              >
                {initials(c.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium text-[#010100] leading-snug"
                  style={{ fontFamily: 'Roboto, sans-serif' }}
                >
                  {c.name}
                </p>
                {c.role && (
                  <p
                    className="text-[10px] text-gray-400"
                    style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
                  >
                    {c.role}
                  </p>
                )}
                {c.email && (
                  <a
                    href={`mailto:${c.email}`}
                    className="text-xs text-[#02348E] hover:underline truncate block"
                    style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
                  >
                    {c.email}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Deals tab ───────────────────────────────────────────────────────────────

function DealsTab({ deals }) {
  if (deals.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 p-8 text-center">
        <p className="text-sm text-gray-400" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
          No deals linked to this partner yet
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {deals.map(d => (
        <Link
          key={d.id}
          to={`/deal/${d.id}`}
          className="bg-white rounded-lg border border-gray-100 p-4 flex items-center gap-4 hover:border-[#02348E]/30 hover:shadow-sm transition-all block"
        >
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-medium text-[#010100] truncate"
              style={{ fontFamily: 'Roboto, sans-serif' }}
            >
              {d.title}
            </p>
            {d.run_start && (
              <p
                className="text-xs text-gray-400 mt-0.5"
                style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
              >
                {d.run_start} → {d.run_end ?? '—'}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {d.package && (
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide ${
                  PACKAGE_COLORS[d.package] ?? 'bg-gray-100 text-gray-600'
                }`}
                style={{ fontFamily: 'Roboto, sans-serif' }}
              >
                {d.package}
              </span>
            )}
            <span
              className={`text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-wide ${
                STAGE_COLORS[d.stage] ?? 'bg-gray-100 text-gray-600'
              }`}
              style={{ fontFamily: 'Roboto, sans-serif' }}
            >
              {STAGE_LABELS[d.stage] ?? d.stage}
            </span>
            {d.total_value && (
              <span
                className="text-sm font-semibold text-[#02348E]"
                style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
              >
                {fmt(d.total_value)}
              </span>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}

// ─── Tasks tab ───────────────────────────────────────────────────────────────

function TasksTab({ partnerId, partner }) {
  const [tasks,  setTasks]  = useState([])
  const [modal,  setModal]  = useState(false)

  useEffect(() => {
    if (partnerId.startsWith('sample-')) {
      setTasks((SAMPLE_TASKS_MAP[partnerId] ?? []).map(t => ({
        ...t, partner_id: partnerId,
        partners: { id: partnerId, name: partner?.name ?? '', type: partner?.type ?? '' },
      })))
      return
    }
    supabase.from('tasks').select('*, partners(id, name, type)')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setTasks(data) })
  }, [partnerId])

  function handleCreated(task) {
    setTasks(prev => [task, ...prev])
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button
          onClick={() => setModal(true)}
          className="bg-[#02348E] hover:bg-[#02348E]/90 text-white text-sm font-medium px-3 py-1.5 rounded transition-colors"
          style={{ fontFamily: 'Roboto, sans-serif' }}
        >
          + New Task
        </button>
      </div>

      <TaskBoard tasks={tasks} setTasks={setTasks} showPartner={false} />

      {modal && (
        <NewTaskModal
          partners={partner ? [{ id: partner.id, name: partner.name, type: partner.type }] : []}
          defaultPartnerId={partnerId.startsWith('sample-') ? null : partnerId}
          onClose={() => setModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}

// ─── Notes tab ───────────────────────────────────────────────────────────────

function NotesTab({ partnerId }) {
  const [notes, setNotes]   = useState([])
  const [entry, setEntry]   = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    if (partnerId.startsWith('sample-')) return
    supabase.from('notes').select('*').eq('partner_id', partnerId)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setNotes(data) })
      .catch(() => null)
  }, [partnerId])

  async function addNote() {
    const body = entry.trim()
    if (!body) return
    setPosting(true)
    const payload = { body, partner_id: partnerId }
    const { data } = await supabase.from('notes').insert(payload).select().single().catch(() => ({ data: null }))
    setNotes(prev => [data ?? { id: crypto.randomUUID(), ...payload, created_at: new Date().toISOString() }, ...prev])
    setEntry('')
    setPosting(false)
  }

  function fmtDate(ts) {
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div>
      {/* Entry area */}
      <div className="bg-white rounded-lg border border-gray-100 p-4 mb-4">
        <h3
          className="text-sm font-semibold text-[#010100] mb-3"
          style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
        >
          Add Note
        </h3>
        <textarea
          value={entry}
          onChange={e => setEntry(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addNote() }}
          placeholder="Meeting notes, call recap, follow-up reminders… (⌘↵ to save)"
          rows={4}
          className="w-full text-sm border border-gray-200 rounded px-3 py-2 resize-none focus:outline-none focus:border-[#02348E] text-[#010100] mb-2"
          style={{ fontFamily: 'Roboto, sans-serif' }}
        />
        <button
          onClick={addNote}
          disabled={posting || !entry.trim()}
          className="bg-[#02348E] hover:bg-[#02348E]/90 disabled:opacity-40 text-white text-sm font-medium px-4 py-1.5 rounded transition-colors"
          style={{ fontFamily: 'Roboto, sans-serif' }}
        >
          Save Note
        </button>
      </div>

      {/* Notes list */}
      <div className="space-y-3">
        {notes.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-100 p-8 text-center">
            <p
              className="text-sm text-gray-400"
              style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
            >
              No notes yet — add meeting logs, call recaps, or reminders above
            </p>
          </div>
        ) : notes.map(note => (
          <div key={note.id} className="bg-white rounded-lg border border-gray-100 p-4">
            <p
              className="text-[10px] text-gray-400 mb-1.5 uppercase tracking-wide"
              style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
            >
              {fmtDate(note.created_at)}
            </p>
            <p
              className="text-sm text-[#010100] leading-relaxed whitespace-pre-wrap"
              style={{ fontFamily: 'Roboto, sans-serif' }}
            >
              {note.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function PartnerRecord() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [partner, setPartner]   = useState(null)
  const [contacts, setContacts] = useState([])
  const [deals, setDeals]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('Overview')

  useEffect(() => {
    if (id?.startsWith('sample-')) {
      const p = SAMPLE_PARTNERS[id] ?? Object.values(SAMPLE_PARTNERS)[0]
      setPartner(p)
      setContacts(SAMPLE_CONTACTS[id] ?? [])
      setDeals(SAMPLE_DEALS_MAP[id] ?? [])
      setLoading(false)
      return
    }

    async function load() {
      const [{ data: p }, { data: c }, { data: d }] = await Promise.all([
        supabase.from('partners').select('*').eq('id', id).single().catch(() => ({ data: null })),
        supabase.from('contacts').select('*').eq('partner_id', id).order('name').catch(() => ({ data: [] })),
        supabase.from('deals').select('*').eq('partner_id', id).order('created_at', { ascending: false }).catch(() => ({ data: [] })),
      ])
      if (p) setPartner(p)
      setContacts(c ?? [])
      setDeals(d ?? [])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-400" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
        Loading…
      </div>
    )
  }

  if (!partner) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500 mb-2" style={{ fontFamily: 'Roboto, sans-serif' }}>
          Partner not found.
        </p>
        <button
          onClick={() => navigate('/partners')}
          className="text-sm text-[#02348E] hover:underline"
          style={{ fontFamily: 'Roboto, sans-serif' }}
        >
          ← Back to partners
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-4">

      {/* Back nav */}
      <button
        onClick={() => navigate('/partners')}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#02348E] mb-4 transition-colors"
        style={{ fontFamily: 'Roboto, sans-serif' }}
      >
        ← Partners
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <PartnerTypeTag type={partner.type} />
            {!partner.active && (
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-100 text-red-600 uppercase tracking-wide"
                style={{ fontFamily: 'Roboto, sans-serif' }}
              >
                Inactive
              </span>
            )}
          </div>
          <h1
            className="text-2xl font-semibold text-[#010100]"
            style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
          >
            {partner.name}
          </h1>
          {partner.website && (
            <a
              href={`https://${partner.website.replace(/^https?:\/\//, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#02348E] hover:underline"
              style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
            >
              {partner.website}
            </a>
          )}
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide" style={{ fontFamily: 'Roboto, sans-serif' }}>
              Deals
            </p>
            <p className="text-xl font-bold text-[#02348E]" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
              {deals.length}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide" style={{ fontFamily: 'Roboto, sans-serif' }}>
              Contacts
            </p>
            <p className="text-xl font-bold text-[#02348E]" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
              {contacts.length}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200 mb-4">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t
                ? 'border-[#02348E] text-[#02348E]'
                : 'border-transparent text-gray-500 hover:text-[#010100]'
            }`}
            style={{ fontFamily: 'Roboto, sans-serif' }}
          >
            {t}
            {t === 'Deals' && deals.length > 0 && (
              <span className="ml-1.5 text-[10px] bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5">
                {deals.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'Overview' && (
        <OverviewTab
          partner={partner}
          contacts={contacts}
          onPartnerUpdate={patch => setPartner(prev => ({ ...prev, ...patch }))}
        />
      )}
      {tab === 'Deals' && <DealsTab deals={deals} />}
      {tab === 'Tasks' && <TasksTab partnerId={id} partner={partner} />}
      {tab === 'Notes' && <NotesTab partnerId={id} />}
    </div>
  )
}
