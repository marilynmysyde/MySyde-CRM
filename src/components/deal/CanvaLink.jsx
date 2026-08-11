import { useState } from 'react'
import { supabase } from '../../lib/supabase'

function extractCanvaName(url) {
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean)
    const raw   = parts[parts.length - 1] ?? ''
    return raw.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Canva file'
  } catch {
    return 'Canva file'
  }
}

export default function CanvaLink({ deal, onUpdate }) {
  const [url, setUrl]     = useState('')
  const [name, setName]   = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  function handleUrlChange(v) {
    setUrl(v)
    if (v.includes('canva.com') && !name) {
      setName(extractCanvaName(v))
    }
  }

  async function save() {
    if (!url.trim()) return
    setSaving(true)
    const finalName = name.trim() || extractCanvaName(url)
    await supabase.from('deals')
      .update({ canva_file_url: url.trim(), canva_file_name: finalName })
      .eq('id', deal.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    onUpdate?.({ canva_file_url: url.trim(), canva_file_name: finalName })
  }

  const linked = deal.canva_file_url

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-4">
      <h3
        className="text-sm font-semibold text-[#111827] mb-3"
        style={{ fontFamily: "'Manrope', sans-serif" }}
      >
        Canva File
      </h3>

      {linked && (
        <div className="flex items-center gap-2 mb-3 p-2.5 bg-[#1D4ED8]/5 rounded-lg border border-[#1D4ED8]/20">
          <span className="text-lg shrink-0">🎨</span>
          <a
            href={linked}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#1D4ED8] hover:underline truncate flex-1"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            {deal.canva_file_name || 'View Canva file →'}
          </a>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <input
          type="url"
          value={url}
          onChange={e => handleUrlChange(e.target.value)}
          placeholder={linked ? 'Paste new Canva URL to update…' : 'Paste Canva URL…'}
          className="text-sm border border-gray-200 rounded px-3 py-2 w-full focus:outline-none focus:border-[#1D4ED8] text-[#111827]"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        />
        {url && (
          <>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="File name (auto-detected)…"
              className="text-sm border border-gray-200 rounded px-3 py-2 w-full focus:outline-none focus:border-[#1D4ED8] text-[#111827]"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            />
            <button
              onClick={save}
              disabled={saving}
              className="bg-[#1D4ED8] hover:bg-[#1D4ED8]/90 disabled:opacity-50 text-white text-sm font-medium px-4 py-1.5 rounded transition-colors self-start"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Link'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
