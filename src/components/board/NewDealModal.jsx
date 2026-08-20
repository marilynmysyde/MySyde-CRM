import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const STAGES = ['prospect', 'pitched', 'proposal', 'creative', 'live']
const STAGE_LABELS = {
  prospect: 'Prospect', pitched: 'Pitched', proposal: 'Proposal',
  creative: 'Creative', live: 'Live',
}

const inputCls = 'w-full text-sm border border-gray-200 rounded px-3 py-1.5 focus:outline-none focus:border-[#1D4ED8] text-[#111827] bg-white'
const labelCls = 'text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1'

export default function NewDealModal({ onClose, onCreated }) {
  const [partners, setPartners] = useState([])
  const [form, setForm] = useState({
    title:          '',
    partner_id:     '',
    stage:          'prospect',
    run_start:      '',
    run_end:        '',
    notes:          '',
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
      } catch { /* no partners — still usable */ }
    }
    fetchPartners()
  }, [])

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function submit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)

    const payload = {
      title:          form.title.trim(),
      partner_id:     form.partner_id || null,
      stage:          form.stage,
      run_start:      form.run_start || null,
      run_end:        form.run_end || null,
      notes:          form.notes.trim() || null,
      design_status:  'none',
    }

    const { data } = await supabase
      .from('deals')
      .insert(payload)
      .select('*, partners(id, name, type)')
      .single()

    const created = data ?? {
      ...payload,
      id:          crypto.randomUUID(),
      created_at:  new Date().toISOString(),
      total_value: 0,
      partners:    partners.find(p => p.id === payload.partner_id) ?? null,
    }

    onCreated(created)
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />

      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2
            className="text-base font-semibold text-[#111827]"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            New Deal
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

          {/* Title */}
          <div>
            <label className={labelCls} style={{ fontFamily: 'Manrope, sans-serif' }}>Deal Title *</label>
            <input
              autoFocus
              required
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. Spring Campaign — Top Banner"
              className={inputCls}
              style={{ fontFamily: 'Manrope, sans-serif' }}
            />
          </div>

          {/* Partner + Stage */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} style={{ fontFamily: 'Manrope, sans-serif' }}>Partner</label>
              <select
                value={form.partner_id}
                onChange={e => set('partner_id', e.target.value)}
                className={inputCls}
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                <option value="">— No partner —</option>
                {partners.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} style={{ fontFamily: 'Manrope, sans-serif' }}>Stage</label>
              <select
                value={form.stage}
                onChange={e => set('stage', e.target.value)}
                className={inputCls}
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                {STAGES.map(s => (
                  <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs text-[#6B7280]" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Placement, package, and pricing are set on the deal card after it's created — this just creates the deal.
          </div>

          {/* Run dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} style={{ fontFamily: 'Manrope, sans-serif' }}>Run Start</label>
              <input
                type="date"
                value={form.run_start}
                onChange={e => set('run_start', e.target.value)}
                className={inputCls}
                style={{ fontFamily: 'Manrope, sans-serif' }}
              />
            </div>
            <div>
              <label className={labelCls} style={{ fontFamily: 'Manrope, sans-serif' }}>Run End</label>
              <input
                type="date"
                value={form.run_end}
                onChange={e => set('run_end', e.target.value)}
                className={inputCls}
                style={{ fontFamily: 'Manrope, sans-serif' }}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={labelCls} style={{ fontFamily: 'Manrope, sans-serif' }}>Notes</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={2}
              placeholder="Internal notes, context…"
              className={`${inputCls} resize-none`}
              style={{ fontFamily: 'Manrope, sans-serif' }}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded transition-colors"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.title.trim()}
              className="bg-[#1D4ED8] hover:bg-[#1D4ED8]/90 disabled:opacity-40 text-white text-sm font-medium px-5 py-2 rounded transition-colors"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              {saving ? 'Creating…' : 'Create Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
