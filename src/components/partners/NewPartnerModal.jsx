import { useState } from 'react'
import { supabase } from '../../lib/supabase'

const PARTNER_TYPES = [
  { value: 'chamber',        label: 'Chamber of Commerce' },
  { value: 'city_gov',       label: 'City / Government' },
  { value: 'downtown_assoc', label: 'Downtown Association' },
  { value: 'community_org',  label: 'Community Organization' },
  { value: 'local_business', label: 'Local Business' },
  { value: 'nonprofit',      label: 'Nonprofit' },
  { value: 'other',          label: 'Other' },
]

const inputCls = 'w-full text-sm border border-gray-200 rounded px-3 py-1.5 focus:outline-none focus:border-[#02348E] text-[#010100] bg-white'
const labelCls = 'text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1'

export default function NewPartnerModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name:    '',
    type:    'local_business',
    website: '',
    address: '',
    notes:   '',
    active:  true,
  })
  const [saving, setSaving] = useState(false)

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function submit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)

    const payload = {
      name:    form.name.trim(),
      type:    form.type,
      website: form.website.trim() || null,
      address: form.address.trim() || null,
      notes:   form.notes.trim() || null,
      active:  form.active,
    }

    const { data } = await supabase
      .from('partners')
      .insert(payload)
      .select()
      .single()
      .catch(() => ({ data: null }))

    const created = data ?? {
      ...payload,
      id:         crypto.randomUUID(),
      created_at: new Date().toISOString(),
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
            Add Partner
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
            <label className={labelCls} style={{ fontFamily: 'Roboto, sans-serif' }}>Organization Name *</label>
            <input
              autoFocus
              required
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. Morgan Hill Chamber of Commerce"
              className={inputCls}
              style={{ fontFamily: 'Roboto, sans-serif' }}
            />
          </div>

          {/* Type */}
          <div>
            <label className={labelCls} style={{ fontFamily: 'Roboto, sans-serif' }}>Partner Type</label>
            <div className="grid grid-cols-2 gap-1.5">
              {PARTNER_TYPES.map(pt => (
                <button
                  key={pt.value}
                  type="button"
                  onClick={() => set('type', pt.value)}
                  className={`text-xs px-3 py-2 rounded text-left font-medium transition-colors ${
                    form.type === pt.value
                      ? 'bg-[#02348E] text-white'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                  style={{ fontFamily: 'Roboto, sans-serif' }}
                >
                  {pt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Website + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} style={{ fontFamily: 'Roboto, sans-serif' }}>Website</label>
              <input
                type="text"
                value={form.website}
                onChange={e => set('website', e.target.value)}
                placeholder="example.com"
                className={inputCls}
                style={{ fontFamily: 'Roboto, sans-serif' }}
              />
            </div>
            <div>
              <label className={labelCls} style={{ fontFamily: 'Roboto, sans-serif' }}>Status</label>
              <div className="flex gap-2 mt-1">
                {[true, false].map(val => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => set('active', val)}
                    className={`flex-1 text-xs py-1.5 rounded font-medium border transition-colors ${
                      form.active === val
                        ? val
                          ? 'bg-green-500 text-white border-green-500'
                          : 'bg-gray-400 text-white border-gray-400'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ fontFamily: 'Roboto, sans-serif' }}
                  >
                    {val ? 'Active' : 'Inactive'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className={labelCls} style={{ fontFamily: 'Roboto, sans-serif' }}>Address</label>
            <input
              type="text"
              value={form.address}
              onChange={e => set('address', e.target.value)}
              placeholder="Street address…"
              className={inputCls}
              style={{ fontFamily: 'Roboto, sans-serif' }}
            />
          </div>

          {/* Notes */}
          <div>
            <label className={labelCls} style={{ fontFamily: 'Roboto, sans-serif' }}>Notes</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={2}
              placeholder="Relationship context, key contacts…"
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
              {saving ? 'Saving…' : 'Add Partner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
