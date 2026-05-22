import { useState } from 'react'
import { supabase } from '../../lib/supabase'

const PRIORITIES   = ['high', 'medium', 'low']
const RECURRENCES  = ['weekly', 'monthly', 'quarterly']

const inputCls = 'w-full text-sm border border-gray-200 rounded px-3 py-1.5 focus:outline-none focus:border-[#02348E] text-[#010100] bg-white'
const labelCls = 'text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1'

export default function NewTaskModal({ partners = [], defaultPartnerId = null, onClose, onCreated }) {
  const [form, setForm] = useState({
    title:           '',
    description:     '',
    due_date:        '',
    priority:        'medium',
    partner_id:      defaultPartnerId ?? '',
    assigned_to:     '',
    tags:            '',
    is_recurring:    false,
    recurrence_rule: 'weekly',
  })
  const [saving, setSaving] = useState(false)

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function submit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)

    const payload = {
      title:           form.title.trim(),
      description:     form.description.trim() || null,
      due_date:        form.due_date || null,
      priority:        form.priority,
      status:          'todo',
      partner_id:      form.partner_id || null,
      assigned_to:     form.assigned_to.trim() || null,
      tags:            form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      is_recurring:    form.is_recurring,
      recurrence_rule: form.is_recurring ? form.recurrence_rule : null,
    }

    const { data } = await supabase
      .from('tasks')
      .insert(payload)
      .select('*, partners(id, name, type)')
      .single()

    const created = data ?? {
      ...payload,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      partners: partners.find(p => p.id === payload.partner_id) ?? null,
    }

    onCreated(created)
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2
            className="text-base font-semibold text-[#010100]"
            style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
          >
            New Task
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
            <label className={labelCls} style={{ fontFamily: 'Roboto, sans-serif' }}>Title *</label>
            <input
              autoFocus
              required
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="Task title…"
              className={inputCls}
              style={{ fontFamily: 'Roboto, sans-serif' }}
            />
          </div>

          {/* Description */}
          <div>
            <label className={labelCls} style={{ fontFamily: 'Roboto, sans-serif' }}>Description</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={2}
              placeholder="Optional notes or context…"
              className={`${inputCls} resize-none`}
              style={{ fontFamily: 'Roboto, sans-serif' }}
            />
          </div>

          {/* Due date + priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} style={{ fontFamily: 'Roboto, sans-serif' }}>Due Date</label>
              <input
                type="date"
                value={form.due_date}
                onChange={e => set('due_date', e.target.value)}
                className={inputCls}
                style={{ fontFamily: 'Roboto, sans-serif' }}
              />
            </div>
            <div>
              <label className={labelCls} style={{ fontFamily: 'Roboto, sans-serif' }}>Priority</label>
              <select
                value={form.priority}
                onChange={e => set('priority', e.target.value)}
                className={inputCls}
                style={{ fontFamily: 'Roboto, sans-serif' }}
              >
                {PRIORITIES.map(p => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Partner */}
          <div>
            <label className={labelCls} style={{ fontFamily: 'Roboto, sans-serif' }}>Partner</label>
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

          {/* Assigned to + tags */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} style={{ fontFamily: 'Roboto, sans-serif' }}>Assigned To</label>
              <input
                type="text"
                value={form.assigned_to}
                onChange={e => set('assigned_to', e.target.value)}
                placeholder="Name…"
                className={inputCls}
                style={{ fontFamily: 'Roboto, sans-serif' }}
              />
            </div>
            <div>
              <label className={labelCls} style={{ fontFamily: 'Roboto, sans-serif' }}>Tags</label>
              <input
                type="text"
                value={form.tags}
                onChange={e => set('tags', e.target.value)}
                placeholder="design, follow-up…"
                className={inputCls}
                style={{ fontFamily: 'Roboto, sans-serif' }}
              />
            </div>
          </div>

          {/* Recurring toggle */}
          <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-3">
            <div>
              <p
                className="text-sm font-medium text-[#010100]"
                style={{ fontFamily: 'Roboto, sans-serif' }}
              >
                Recurring Task
              </p>
              <p
                className="text-[10px] text-gray-400 mt-0.5"
                style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
              >
                Auto-generates next instance when marked Done
              </p>
            </div>
            <button
              type="button"
              onClick={() => set('is_recurring', !form.is_recurring)}
              className="relative shrink-0 rounded-full transition-colors"
              style={{ width: 40, height: 22, background: form.is_recurring ? '#02348E' : '#d1d5db' }}
            >
              <span
                className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                style={{ transform: form.is_recurring ? 'translateX(20px)' : 'translateX(2px)' }}
              />
            </button>
          </div>

          {/* Recurrence rule */}
          {form.is_recurring && (
            <div>
              <label className={labelCls} style={{ fontFamily: 'Roboto, sans-serif' }}>Repeats</label>
              <div className="flex gap-2">
                {RECURRENCES.map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => set('recurrence_rule', r)}
                    className={`flex-1 text-xs py-2 rounded font-medium transition-colors ${
                      form.recurrence_rule === r
                        ? 'bg-[#02348E] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    style={{ fontFamily: 'Roboto, sans-serif' }}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </div>
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
              disabled={saving || !form.title.trim()}
              className="bg-[#02348E] hover:bg-[#02348E]/90 disabled:opacity-40 text-white text-sm font-medium px-5 py-2 rounded transition-colors"
              style={{ fontFamily: 'Roboto, sans-serif' }}
            >
              {saving ? 'Creating…' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
