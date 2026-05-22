import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const STATUS_OPTIONS = [
  { value: 'pending',  label: 'Pending Installation' },
  { value: 'active',   label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

const inputCls = 'w-full text-sm border border-gray-200 rounded px-3 py-1.5 focus:outline-none focus:border-[#02348E] text-[#010100] bg-white'
const labelCls = 'text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1'

export default function NewKioskModal({ onClose, onCreated }) {
  const [partners, setPartners] = useState([])
  const [form, setForm] = useState({
    name:         '',
    location:     '',
    partner_id:   '',
    status:       'pending',
    installed_at: '',
    notes:        '',
  })
  const [saving, setSaving] = useState(false)

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

    const payload = {
      name:         form.name.trim(),
      location:     form.location.trim() || null,
      partner_id:   form.partner_id || null,
      status:       form.status,
      installed_at: form.installed_at || null,
      notes:        form.notes.trim() || null,
    }

    const { data } = await supabase
      .from('kiosks')
      .insert(payload)
      .select('*, partners(name, type)')
      .single()

    const created = data ?? {
      ...payload,
      id:          crypto.randomUUID(),
      created_at:  new Date().toISOString(),
      deal_count:  0,
      partners:    partners.find(p => p.id === payload.partner_id) ?? null,
    }

    onCreated(created)
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
            Add Kiosk
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
            <label className={labelCls} style={{ fontFamily: 'Roboto, sans-serif' }}>Kiosk Name *</label>
            <input
              autoFocus
              required
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. Kiosk 06 — Library Plaza"
              className={inputCls}
              style={{ fontFamily: 'Roboto, sans-serif' }}
            />
          </div>

          {/* Location */}
          <div>
            <label className={labelCls} style={{ fontFamily: 'Roboto, sans-serif' }}>Location</label>
            <input
              type="text"
              value={form.location}
              onChange={e => set('location', e.target.value)}
              placeholder="Address or landmark"
              className={inputCls}
              style={{ fontFamily: 'Roboto, sans-serif' }}
            />
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

          {/* Status + Install date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} style={{ fontFamily: 'Roboto, sans-serif' }}>Status</label>
              <select
                value={form.status}
                onChange={e => set('status', e.target.value)}
                className={inputCls}
                style={{ fontFamily: 'Roboto, sans-serif' }}
              >
                {STATUS_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} style={{ fontFamily: 'Roboto, sans-serif' }}>Install Date</label>
              <input
                type="date"
                value={form.installed_at}
                onChange={e => set('installed_at', e.target.value)}
                className={inputCls}
                style={{ fontFamily: 'Roboto, sans-serif' }}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={labelCls} style={{ fontFamily: 'Roboto, sans-serif' }}>Notes</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={2}
              placeholder="Site notes, access info, maintenance details…"
              className={`${inputCls} resize-none`}
              style={{ fontFamily: 'Roboto, sans-serif' }}
            />
          </div>

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
              {saving ? 'Saving…' : 'Add Kiosk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
