import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PartnerTypeTag from '../components/shared/PartnerTypeTag'

// ─── Sample contacts ──────────────────────────────────────────────────────────

const SAMPLE_CONTACTS = {
  'c1': {
    id: 'c1', name: 'Sandra Lee', role: 'Executive Director',
    email: 'sandra@mhchamber.com', phone: '408-555-0101',
    mailerlite_id: null,
    notes: 'Key decision-maker for the chamber. Prefers email. Good relationship — helped co-host the spring expo.',
    partners: { id: 'sample-partner-1', name: 'Morgan Hill Chamber', type: 'chamber' },
  },
  'c2': {
    id: 'c2', name: 'James Ortega', role: 'City Manager',
    email: 'jortega@morgan-hill.ca.gov', phone: '408-555-0201',
    mailerlite_id: null,
    notes: 'Civic contact. Approves all city-facing advertising contracts. Formal communication preferred.',
    partners: { id: 'sample-partner-3', name: 'City of Morgan Hill', type: 'city_gov' },
  },
  'c3': {
    id: 'c3', name: 'Priya Nair', role: 'Events Coordinator',
    email: 'priya@downtownmh.org', phone: '408-555-0301',
    mailerlite_id: null,
    notes: 'Great energy — manages all downtown events. Primary contact for kiosk launch planning.',
    partners: { id: 'sample-partner-2', name: 'Downtown Morgan Hill', type: 'downtown_assoc' },
  },
}

// ─── MailerLite subscriber panel ─────────────────────────────────────────────

const ML_STATUS_CONFIG = {
  active:        { label: 'Subscribed',    pill: 'bg-green-50 text-green-700 border-green-200'  },
  unsubscribed:  { label: 'Unsubscribed',  pill: 'bg-red-50 text-red-600 border-red-200'        },
  unconfirmed:   { label: 'Unconfirmed',   pill: 'bg-amber-50 text-amber-700 border-amber-200'  },
  bounced:       { label: 'Bounced',       pill: 'bg-gray-100 text-gray-500 border-gray-200'    },
  junk:          { label: 'Junk',          pill: 'bg-gray-100 text-gray-500 border-gray-200'    },
  unknown:       { label: 'Unknown',       pill: 'bg-gray-100 text-gray-400 border-gray-200'    },
}

function MailerLitePanel({ email, mailerliteId }) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  async function fetchStats() {
    if (!email) return
    setLoading(true)
    setError(null)
    try {
      const { data: fnData, error: fnErr } = await supabase.functions.invoke('mailerlite-contact', {
        body: mailerliteId ? { mailerlite_id: mailerliteId } : { email },
      })
      if (fnErr) throw fnErr
      setData(fnData)
    } catch (e) {
      setError('Could not load MailerLite data. Check that the Edge Function is deployed and the API key is set.')
    }
    setLoading(false)
  }

  const statusCfg = data ? (ML_STATUS_CONFIG[data.status] ?? ML_STATUS_CONFIG.unknown) : null

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3
          className="text-sm font-semibold text-[#010100]"
          style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
        >
          MailerLite
        </h3>
        <button
          onClick={fetchStats}
          disabled={loading || !email}
          className="text-xs text-[#02348E] hover:underline disabled:opacity-40"
          style={{ fontFamily: 'Roboto, sans-serif' }}
        >
          {loading ? 'Loading…' : data ? 'Refresh' : 'Load stats'}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-500 mb-2" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
          {error}
        </p>
      )}

      {!data && !loading && !error && (
        <p className="text-xs text-gray-400 italic" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
          Click "Load stats" to fetch subscriber data from MailerLite.
        </p>
      )}

      {data && (
        <div className="space-y-3">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 uppercase tracking-wide w-20 shrink-0" style={{ fontFamily: 'Roboto, sans-serif' }}>
              Status
            </span>
            <span
              className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${statusCfg.pill}`}
              style={{ fontFamily: 'Roboto, sans-serif' }}
            >
              {statusCfg.label}
            </span>
          </div>

          {/* Open rate */}
          {data.open_rate != null && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 uppercase tracking-wide w-20 shrink-0" style={{ fontFamily: 'Roboto, sans-serif' }}>
                Open Rate
              </span>
              <div className="flex items-center gap-2 flex-1">
                <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-[#02348E] h-1.5 rounded-full"
                    style={{ width: `${Math.min(data.open_rate * 100, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-[#010100] shrink-0" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                  {(data.open_rate * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          )}

          {/* Click rate */}
          {data.click_rate != null && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 uppercase tracking-wide w-20 shrink-0" style={{ fontFamily: 'Roboto, sans-serif' }}>
                Click Rate
              </span>
              <div className="flex items-center gap-2 flex-1">
                <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-[#FFEC00] h-1.5 rounded-full"
                    style={{ width: `${Math.min(data.click_rate * 100, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-[#010100] shrink-0" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                  {(data.click_rate * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          )}

          {/* Last campaign */}
          {data.last_campaign && (
            <div className="flex items-start gap-2">
              <span className="text-[10px] text-gray-400 uppercase tracking-wide w-20 shrink-0 pt-0.5" style={{ fontFamily: 'Roboto, sans-serif' }}>
                Last Campaign
              </span>
              <span className="text-xs text-[#010100]" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                {data.last_campaign}
              </span>
            </div>
          )}

          {data.subscribed_at && (
            <p className="text-[10px] text-gray-400" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
              Subscribed {new Date(data.subscribed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const inputCls = 'w-full text-sm border border-gray-200 rounded px-3 py-1.5 focus:outline-none focus:border-[#02348E] text-[#010100] bg-white'

export default function ContactRecord() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const [contact,   setContact]  = useState(null)
  const [notes,     setNotes]    = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [notesSaved,  setNotesSaved]  = useState(false)
  const [loading,   setLoading]  = useState(true)
  const [partners,  setPartners] = useState([])

  // Info editing
  const [editingInfo, setEditingInfo] = useState(false)
  const [infoForm,    setInfoForm]    = useState({ name: '', role: '', email: '', phone: '', partner_id: '' })
  const [savingInfo,  setSavingInfo]  = useState(false)

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting]           = useState(false)

  useEffect(() => {
    if (SAMPLE_CONTACTS[id]) {
      const c = SAMPLE_CONTACTS[id]
      setContact(c)
      setNotes(c.notes ?? '')
      setInfoForm({ name: c.name, role: c.role ?? '', email: c.email ?? '', phone: c.phone ?? '', partner_id: c.partners?.id ?? '' })
      setLoading(false)
      return
    }
    async function load() {
      try {
        const [{ data }, { data: pData }] = await Promise.all([
          supabase.from('contacts').select('*, partners(id, name, type)').eq('id', id).single(),
          supabase.from('partners').select('id, name').eq('active', true).order('name'),
        ])
        if (data) {
          setContact(data)
          setNotes(data.notes ?? '')
          setInfoForm({ name: data.name, role: data.role ?? '', email: data.email ?? '', phone: data.phone ?? '', partner_id: data.partner_id ?? '' })
        }
        if (pData) setPartners(pData)
      } catch { /* nothing */ }
      setLoading(false)
    }
    load()
  }, [id])

  async function deleteContact() {
    if (SAMPLE_CONTACTS[id]) { navigate('/contacts'); return }
    setDeleting(true)
    await supabase.from('contacts').delete().eq('id', id).catch(() => null)
    navigate('/contacts')
  }

  async function saveNotes() {
    setSavingNotes(true)
    await supabase.from('contacts').update({ notes }).eq('id', id).catch(() => null)
    setSavingNotes(false)
    setNotesSaved(true)
    setTimeout(() => setNotesSaved(false), 2500)
  }

  async function saveInfo() {
    setSavingInfo(true)
    const payload = {
      name:       infoForm.name.trim(),
      role:       infoForm.role.trim() || null,
      email:      infoForm.email.trim() || null,
      phone:      infoForm.phone.trim() || null,
      partner_id: infoForm.partner_id || null,
    }
    await supabase.from('contacts').update(payload).eq('id', id).catch(() => null)
    setContact(prev => ({ ...prev, ...payload }))
    setSavingInfo(false)
    setEditingInfo(false)
  }

  if (loading) {
    return <div className="p-6 text-sm text-gray-400" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>Loading…</div>
  }

  if (!contact) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500 mb-2" style={{ fontFamily: 'Roboto, sans-serif' }}>Contact not found.</p>
        <button onClick={() => navigate('/contacts')} className="text-sm text-[#02348E] hover:underline" style={{ fontFamily: 'Roboto, sans-serif' }}>← Contacts</button>
      </div>
    )
  }

  const initials = contact.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="max-w-4xl mx-auto px-4 py-4">

      {/* Back nav + delete */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate('/contacts')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#02348E] transition-colors"
          style={{ fontFamily: 'Roboto, sans-serif' }}
        >
          ← Contacts
        </button>

        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500" style={{ fontFamily: 'Roboto, sans-serif' }}>Delete this contact?</span>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded"
              style={{ fontFamily: 'Roboto, sans-serif' }}
            >
              Cancel
            </button>
            <button
              onClick={deleteContact}
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
            Delete contact
          </button>
        )}
      </div>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-[#02348E] flex items-center justify-center shrink-0">
          <span className="text-white text-lg font-semibold" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
            {initials}
          </span>
        </div>
        <div>
          <h1
            className="text-2xl font-semibold text-[#010100]"
            style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
          >
            {contact.name}
          </h1>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            <span className="text-sm text-gray-500" style={{ fontFamily: 'Roboto, sans-serif' }}>
              {contact.role}
            </span>
            {contact.partners && (
              <>
                <span className="text-gray-300">·</span>
                <PartnerTypeTag type={contact.partners.type} />
                <Link
                  to={`/partner/${contact.partners.id}`}
                  className="text-sm text-[#02348E] hover:underline"
                  style={{ fontFamily: 'Roboto, sans-serif' }}
                >
                  {contact.partners.name}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Left: contact info + notes */}
        <div className="lg:col-span-2 space-y-4">

          {/* Contact info */}
          <div className="bg-white rounded-lg border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#010100]" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
                Contact Info
              </h3>
              <div className="flex gap-2">
                {editingInfo && (
                  <button onClick={() => setEditingInfo(false)} className="text-xs text-gray-400 hover:text-gray-600" style={{ fontFamily: 'Roboto, sans-serif' }}>
                    Cancel
                  </button>
                )}
                <button
                  onClick={editingInfo ? saveInfo : () => setEditingInfo(true)}
                  disabled={savingInfo}
                  className={`text-xs font-medium px-3 py-1.5 rounded transition-colors ${editingInfo ? 'bg-[#02348E] text-white hover:bg-[#02348E]/90' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  style={{ fontFamily: 'Roboto, sans-serif' }}
                >
                  {savingInfo ? 'Saving…' : editingInfo ? 'Save' : 'Edit'}
                </button>
              </div>
            </div>

            {editingInfo ? (
              <div className="space-y-3">
                {[
                  { label: 'Name',  field: 'name',  type: 'text'  },
                  { label: 'Role',  field: 'role',  type: 'text'  },
                  { label: 'Email', field: 'email', type: 'email' },
                  { label: 'Phone', field: 'phone', type: 'tel'   },
                ].map(({ label, field, type }) => (
                  <div key={field}>
                    <label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1" style={{ fontFamily: 'Roboto, sans-serif' }}>{label}</label>
                    <input
                      type={type}
                      value={infoForm[field]}
                      onChange={e => setInfoForm(prev => ({ ...prev, [field]: e.target.value }))}
                      className={inputCls}
                      style={{ fontFamily: 'Roboto, sans-serif' }}
                    />
                  </div>
                ))}
                <div>
                  <label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1" style={{ fontFamily: 'Roboto, sans-serif' }}>Partner</label>
                  <select
                    value={infoForm.partner_id}
                    onChange={e => setInfoForm(prev => ({ ...prev, partner_id: e.target.value }))}
                    className={inputCls}
                    style={{ fontFamily: 'Roboto, sans-serif' }}
                  >
                    <option value="">— No partner —</option>
                    {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {contact.email && (
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wide w-12 shrink-0" style={{ fontFamily: 'Roboto, sans-serif' }}>Email</span>
                    <a href={`mailto:${contact.email}`} className="text-sm text-[#02348E] hover:underline" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                      {contact.email}
                    </a>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wide w-12 shrink-0" style={{ fontFamily: 'Roboto, sans-serif' }}>Phone</span>
                    <a href={`tel:${contact.phone}`} className="text-sm text-[#010100] hover:text-[#02348E]" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                      {contact.phone}
                    </a>
                  </div>
                )}
                {!contact.email && !contact.phone && (
                  <p className="text-xs text-gray-400 italic" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>No contact info yet — click Edit to add.</p>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg border border-gray-100 p-4">
            <h3
              className="text-sm font-semibold text-[#010100] mb-3"
              style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
            >
              Notes
            </h3>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={5}
              placeholder="Relationship notes, preferences, meeting summaries…"
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

        {/* Right: MailerLite */}
        <div className="lg:col-span-1">
          <MailerLitePanel email={contact.email} mailerliteId={contact.mailerlite_id} />
        </div>
      </div>
    </div>
  )
}
