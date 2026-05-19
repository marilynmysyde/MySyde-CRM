import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import PlatformBadge, { ALL_PLATFORMS, PLATFORM_LABELS } from './PlatformBadge'

const STATUSES = ['idea', 'draft', 'review', 'scheduled', 'live']
const STATUS_LABELS = { idea: 'Idea', draft: 'Draft', review: 'Review', scheduled: 'Scheduled', live: 'Live' }

const inputCls = 'w-full text-sm border border-gray-200 rounded px-3 py-1.5 focus:outline-none focus:border-[#02348E] text-[#010100] bg-white'
const labelCls = 'text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1'

export default function NewPostModal({ partners = [], post = null, onClose, onSaved }) {
  const isEdit = !!post

  const [form, setForm] = useState({
    title:          post?.title          ?? '',
    caption:        post?.caption        ?? '',
    platforms:      post?.platforms      ?? [],
    status:         post?.status         ?? 'idea',
    scheduled_at:   post?.scheduled_at   ? post.scheduled_at.slice(0, 16) : '',
    partner_id:     post?.partner_id     ?? '',
    canva_file_url: post?.canva_file_url ?? '',
    hashtags:       (post?.hashtags ?? []).join(', '),
    notes:          post?.notes          ?? '',
  })
  const [saving, setSaving] = useState(false)

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function togglePlatform(platform) {
    setForm(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform],
    }))
  }

  function extractCanvaName(url) {
    if (!url) return ''
    const match = url.match(/\/design\/([^/]+)\/([^/?]+)/)
    return match ? decodeURIComponent(match[2]).replace(/-/g, ' ') : 'Canva Design'
  }

  async function submit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)

    const payload = {
      title:          form.title.trim(),
      caption:        form.caption.trim() || null,
      platforms:      form.platforms,
      status:         form.status,
      scheduled_at:   form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
      partner_id:     form.partner_id || null,
      canva_file_url: form.canva_file_url.trim() || null,
      canva_file_name: form.canva_file_url.trim() ? extractCanvaName(form.canva_file_url.trim()) || 'Canva Design' : null,
      hashtags:       form.hashtags ? form.hashtags.split(',').map(t => t.trim()).filter(Boolean) : [],
      notes:          form.notes.trim() || null,
    }

    let saved = null
    if (isEdit) {
      const { data } = await supabase.from('posts').update(payload)
        .eq('id', post.id).select('*, partners(id, name, type)').single()
        .catch(() => ({ data: null }))
      saved = data ?? { ...post, ...payload }
    } else {
      const { data } = await supabase.from('posts').insert(payload)
        .select('*, partners(id, name, type)').single()
        .catch(() => ({ data: null }))
      saved = data ?? {
        ...payload,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        partners: partners.find(p => p.id === payload.partner_id) ?? null,
      }
    }

    onSaved(saved)
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
            className="text-base font-semibold text-[#010100]"
            style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
          >
            {isEdit ? 'Edit Post' : 'New Post'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
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
              placeholder="Post title…"
              className={inputCls}
              style={{ fontFamily: 'Roboto, sans-serif' }}
            />
          </div>

          {/* Caption */}
          <div>
            <label className={labelCls} style={{ fontFamily: 'Roboto, sans-serif' }}>Caption</label>
            <textarea
              value={form.caption}
              onChange={e => set('caption', e.target.value)}
              rows={3}
              placeholder="Write your post caption…"
              className={`${inputCls} resize-none`}
              style={{ fontFamily: 'Roboto, sans-serif' }}
            />
          </div>

          {/* Platforms */}
          <div>
            <label className={labelCls} style={{ fontFamily: 'Roboto, sans-serif' }}>Platforms</label>
            <div className="flex gap-2 flex-wrap">
              {ALL_PLATFORMS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePlatform(p)}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border font-medium transition-all ${
                    form.platforms.includes(p)
                      ? 'border-[#02348E] bg-[#02348E]/5 text-[#02348E]'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                  style={{ fontFamily: 'Roboto, sans-serif' }}
                >
                  <PlatformBadge platform={p} size="xs" />
                  {PLATFORM_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Status + Scheduled at */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} style={{ fontFamily: 'Roboto, sans-serif' }}>Status</label>
              <select
                value={form.status}
                onChange={e => set('status', e.target.value)}
                className={inputCls}
                style={{ fontFamily: 'Roboto, sans-serif' }}
              >
                {STATUSES.map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} style={{ fontFamily: 'Roboto, sans-serif' }}>Scheduled At</label>
              <input
                type="datetime-local"
                value={form.scheduled_at}
                onChange={e => set('scheduled_at', e.target.value)}
                className={inputCls}
                style={{ fontFamily: 'Roboto, sans-serif' }}
              />
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

          {/* Canva URL */}
          <div>
            <label className={labelCls} style={{ fontFamily: 'Roboto, sans-serif' }}>Canva Design URL</label>
            <input
              type="url"
              value={form.canva_file_url}
              onChange={e => set('canva_file_url', e.target.value)}
              placeholder="https://www.canva.com/design/…"
              className={inputCls}
              style={{ fontFamily: 'Roboto, sans-serif' }}
            />
            {form.canva_file_url && (
              <p className="text-[10px] text-[#02348E] mt-1" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                ✦ {extractCanvaName(form.canva_file_url) || 'Canva Design'}
              </p>
            )}
          </div>

          {/* Hashtags */}
          <div>
            <label className={labelCls} style={{ fontFamily: 'Roboto, sans-serif' }}>Hashtags (comma-separated)</label>
            <input
              type="text"
              value={form.hashtags}
              onChange={e => set('hashtags', e.target.value)}
              placeholder="#MorganHill, #LocalBusiness…"
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
              placeholder="Internal notes…"
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
              disabled={saving || !form.title.trim()}
              className="bg-[#02348E] hover:bg-[#02348E]/90 disabled:opacity-40 text-white text-sm font-medium px-5 py-2 rounded transition-colors"
              style={{ fontFamily: 'Roboto, sans-serif' }}
            >
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
