import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const inputCls = 'w-full text-sm border border-gray-200 rounded px-3 py-1.5 focus:outline-none focus:border-[#02348E] text-[#010100] bg-white'
const labelCls = 'text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1'

export default function NewContactModal({ onClose, onCreated }) {
  const [partners, setPartners] = useState([])
  const [form, setForm] = useState({
    name:       '',
    role:       '',
    email:      '',
    phone:      '',
    partner_id: '',
    notes:      '',
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    async function fetchPartners() {
      try {
        const { data } = await supabase
          .from('partners')
          .select('id, name, type')
          .eq('active', true)
          .order('name')
        if (data) setPartners(data)
      } catch { /* partner dropdown stays empty — still usable */ }
    }
    fetchPartners()
  }, [])

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function submit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    setSaveError('')

    const payload = {
      name:       form.name.trim(),
      role:       form.role.trim() || null,
      email:      form.email.trim() || null,
      phone:      form.phone.trim() || null,
      partner_id: form.partner_id || null,
      notes:      form.notes.trim() || null,
    }

    const { data, error } = await supabase
      .from('contacts')
      .insert(payload)
      .select('*, partners(name, type)')
      .single()

    if (error) {
      setSaveError('Could not save to database. Check your Supabase connection.')
      setSaving(false)
      return
    }

    onCreated(data)
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />

      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2
            className="text-base font-semibold text-[#010100]"
            style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
          >
            Add Contact
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={submit} className="px-5 py-4 space-y-4">

          {/* Name */}
          <div>
            <label className={labelCls} style={{ fontFamily: 'Roboto, sans-serif' }}>Full Name *</label>
            <input
              autoFocus
              required
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="First and last name"
              className={inputCls}
              style={{ fontFamily: 'Roboto, sans-serif' }}
            />
          </div>

          {/* Role */}
          <div>
            <label className={labelCls} style={{ fontFamily: 'Roboto, sans-serif' }}>Role / Title</label>
            <input
              type="text"
              value={form.role}
              onChange={e => set('role', e.target.value)}
              placeholder="e.g. Executive Director"
              className={inputCls}
              style={{ fontFamily: 'Roboto, sans-serif' }}
            />
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} style={{ fontFamily: 'Roboto, sans-serif' }}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="name@example.com"
                className={inputCls}
                style={{ fontFamily: 'Roboto, sans-serif' }}
              />
            </div>
            <div>
              <label className={labelCls} style={{ fontFamily: 'Roboto, sans-serif' }}>Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="(408) 555-0100"
                className={inputCls}
                style={{ fontFamily: 'Roboto, sans-serif' }}
              />
            </div>
          </div>

          {/* Partner */}
          <div>
            <label className={labelCls} style={{ fontFamily: 'Roboto, sans-serif' }}>Partner Organization</label>
            <select
              value={form.partner_id}
              onChange={e => set('partner_id', e.target.value)}
              className={inputCls}
              style={{ fontFamily: 'Roboto, sans-serif' }}
            >
              <option value="">— No partner —</option>
              {partners.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className={labelCls} style={{ fontFamily: 'Roboto, sans-serif' }}>Notes</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={2}
              placeholder="Relationship notes, communication preferences…"
              className={`${inputCls} resize-none`}
              style={{ fontFamily: 'Roboto, sans-serif' }}
            />
          </div>

          {/* Save error */}
          {saveError && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded px-3 py-2" style={{ fontFamily: 'Roboto, sans-serif' }}>
              {saveError}
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded transition-colors"
              style={{ fontFamily: 'Roboto, sans-serif' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.name.trim()}
              className="bg-[#02348E] hover:bg-[#02348E]/90 disabled:opacity-40 text-white text-sm font-medium px-5 py-2 rounded transition-colors"
              style={{ fontFamily: 'Roboto, sans-serif' }}
            >
              {saving ? 'Saving…' : 'Add Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
