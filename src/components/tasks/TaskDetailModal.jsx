import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { TEAM_MEMBERS } from '../../lib/team'

const PRIORITIES  = ['high', 'medium', 'low']
const STATUSES    = ['todo', 'in_progress', 'review', 'done']
const RECURRENCES = ['weekly', 'monthly', 'quarterly']

const STATUS_LABEL = {
  todo:        'To Do',
  in_progress: 'In Progress',
  review:      'Review',
  done:        'Done',
}

const inputCls = 'w-full text-sm border border-gray-200 rounded px-3 py-1.5 focus:outline-none focus:border-[#1D4ED8] text-[#111827] bg-white'
const labelCls = 'text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1'

function fmtNoteDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function TaskDetailModal({ task, partners = [], onClose, onUpdated, onCelebrate }) {
  const [form, setForm] = useState({
    title:           task.title ?? '',
    description:     task.description ?? '',
    status:          task.status ?? 'todo',
    priority:        task.priority ?? 'medium',
    due_date:        task.due_date ?? '',
    assigned_to:     task.assigned_to ?? '',
    partner_id:      task.partner_id ?? '',
    tags:            (task.tags ?? []).join(', '),
    is_recurring:    task.is_recurring ?? false,
    recurrence_rule: task.recurrence_rule ?? 'weekly',
  })
  const [saving,   setSaving]   = useState(false)
  const [notes,    setNotes]    = useState([])
  const [newNote,  setNewNote]  = useState('')
  const [posting,  setPosting]  = useState(false)
  const [userEmail, setUserEmail] = useState(null)

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  // Load notes for this task
  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data } = await supabase
        .from('notes')
        .select('*')
        .eq('task_id', task.id)
        .order('created_at', { ascending: false })
      if (!cancelled && data) setNotes(data)
    }
    load()
    return () => { cancelled = true }
  }, [task.id])

  // Grab current user email for note attribution
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data?.user?.email ?? null)
    })
  }, [])

  async function save(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)

    const wasDone   = task.status === 'done'
    const nowDone   = form.status === 'done'
    const justClosed = nowDone && !wasDone

    const payload = {
      title:           form.title.trim(),
      description:     form.description.trim() || null,
      status:          form.status,
      priority:        form.priority,
      due_date:        form.due_date || null,
      assigned_to:     form.assigned_to || null,
      partner_id:      form.partner_id || null,
      tags:            form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      is_recurring:    form.is_recurring,
      recurrence_rule: form.is_recurring ? form.recurrence_rule : null,
      // completed_at powers the Done column's rolling window — stamp on close,
      // clear on reopen. Leave untouched if it was already done and still is.
      completed_at:    nowDone ? (wasDone ? task.completed_at : new Date().toISOString()) : null,
    }

    const { data } = await supabase
      .from('tasks')
      .update(payload)
      .eq('id', task.id)
      .select('*, partners(id, name, type)')
      .single()

    const updated = data ?? { ...task, ...payload }
    onUpdated(updated)
    window.dispatchEvent(new Event('tasks-changed'))
    setSaving(false)

    if (justClosed) onCelebrate?.()
    onClose()
  }

  async function postNote() {
    const body = newNote.trim()
    if (!body) return
    setPosting(true)

    const payload = {
      body,
      task_id:    task.id,
      partner_id: task.partner_id ?? null,
      created_by: userEmail ?? null,
    }

    const { data } = await supabase.from('notes').insert(payload).select('*').single()
    const created = data ?? { ...payload, id: crypto.randomUUID(), created_at: new Date().toISOString() }

    setNotes(prev => [created, ...prev])
    setNewNote('')
    setPosting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2
            className="text-base font-semibold text-[#111827]"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            Task
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={save} className="px-5 py-4 space-y-4">

          {/* Title */}
          <div>
            <label className={labelCls} style={{ fontFamily: 'Manrope, sans-serif' }}>Title *</label>
            <input
              required
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              className={inputCls}
              style={{ fontFamily: 'Manrope, sans-serif' }}
            />
          </div>

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} style={{ fontFamily: 'Manrope, sans-serif' }}>Status</label>
              <select
                value={form.status}
                onChange={e => set('status', e.target.value)}
                className={inputCls}
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                {STATUSES.map(s => (
                  <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} style={{ fontFamily: 'Manrope, sans-serif' }}>Priority</label>
              <select
                value={form.priority}
                onChange={e => set('priority', e.target.value)}
                className={inputCls}
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                {PRIORITIES.map(p => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelCls} style={{ fontFamily: 'Manrope, sans-serif' }}>Description</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={3}
              placeholder="What is this task about?"
              className={`${inputCls} resize-none`}
              style={{ fontFamily: 'Manrope, sans-serif' }}
            />
          </div>

          {/* Due date + Assigned to */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} style={{ fontFamily: 'Manrope, sans-serif' }}>Due Date</label>
              <input
                type="date"
                value={form.due_date}
                onChange={e => set('due_date', e.target.value)}
                className={inputCls}
                style={{ fontFamily: 'Manrope, sans-serif' }}
              />
            </div>
            <div>
              <label className={labelCls} style={{ fontFamily: 'Manrope, sans-serif' }}>Assigned To</label>
              <select
                value={form.assigned_to}
                onChange={e => set('assigned_to', e.target.value)}
                className={inputCls}
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                <option value="">— Unassigned —</option>
                {TEAM_MEMBERS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Partner + Tags */}
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
              <label className={labelCls} style={{ fontFamily: 'Manrope, sans-serif' }}>Tags</label>
              <input
                type="text"
                value={form.tags}
                onChange={e => set('tags', e.target.value)}
                placeholder="design, follow-up…"
                className={inputCls}
                style={{ fontFamily: 'Manrope, sans-serif' }}
              />
            </div>
          </div>

          {/* Recurring toggle */}
          <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-3">
            <div>
              <p className="text-sm font-medium text-[#111827]" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Recurring Task
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5" style={{ fontFamily: "'Manrope', sans-serif" }}>
                Auto-generates next instance when marked Done
              </p>
            </div>
            <button
              type="button"
              onClick={() => set('is_recurring', !form.is_recurring)}
              className="relative shrink-0 rounded-full transition-colors"
              style={{ width: 40, height: 22, background: form.is_recurring ? '#1D4ED8' : '#d1d5db' }}
            >
              <span
                className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                style={{ transform: form.is_recurring ? 'translateX(20px)' : 'translateX(2px)' }}
              />
            </button>
          </div>

          {form.is_recurring && (
            <div>
              <label className={labelCls} style={{ fontFamily: 'Manrope, sans-serif' }}>Repeats</label>
              <div className="flex gap-2">
                {RECURRENCES.map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => set('recurrence_rule', r)}
                    className={`flex-1 text-xs py-2 rounded font-medium transition-colors ${
                      form.recurrence_rule === r
                        ? 'bg-[#1D4ED8] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    style={{ fontFamily: 'Manrope, sans-serif' }}
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
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Notes section */}
        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/50">
          <h3
            className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-3"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            Notes ({notes.length})
          </h3>

          {/* Add note */}
          <div className="flex gap-2 mb-4">
            <textarea
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              rows={2}
              placeholder="Add a note as you work…"
              className={`${inputCls} resize-none flex-1`}
              style={{ fontFamily: 'Manrope, sans-serif' }}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  postNote()
                }
              }}
            />
            <button
              type="button"
              onClick={postNote}
              disabled={posting || !newNote.trim()}
              className="bg-[#1D4ED8] hover:bg-[#1D4ED8]/90 disabled:opacity-40 text-white text-xs font-medium px-3 rounded transition-colors self-start h-[62px]"
              style={{ fontFamily: 'Manrope, sans-serif' }}
              title="⌘/Ctrl + Enter to post"
            >
              {posting ? '…' : 'Post'}
            </button>
          </div>

          {/* Notes list */}
          {notes.length === 0 ? (
            <p
              className="text-xs text-gray-400 italic text-center py-4"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              No notes yet — jot down anything worth remembering as this task moves.
            </p>
          ) : (
            <ul className="space-y-2">
              {notes.map(n => (
                <li
                  key={n.id}
                  className="bg-white border border-gray-100 rounded-md p-3"
                >
                  <p
                    className="text-sm text-[#111827] whitespace-pre-wrap"
                    style={{ fontFamily: 'Manrope, sans-serif' }}
                  >
                    {n.body}
                  </p>
                  <p
                    className="text-[10px] text-gray-400 mt-1.5"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    {n.created_by ?? 'someone'} · {fmtNoteDate(n.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
