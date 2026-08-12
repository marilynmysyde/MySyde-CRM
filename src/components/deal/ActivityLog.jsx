import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const TYPE_CONFIG = {
  note:           { icon: '📝', label: 'Note',           color: 'text-gray-500'    },
  email:          { icon: '📧', label: 'Email',          color: 'text-[#1D4ED8]'   },
  call:           { icon: '📞', label: 'Call',           color: 'text-green-600'   },
  stage_change:   { icon: '🔀', label: 'Stage Changed',  color: 'text-purple-600'  },
  canva_update:   { icon: '🎨', label: 'Canva Updated',  color: 'text-pink-600'    },
  task_complete:  { icon: '✅', label: 'Task Done',       color: 'text-green-600'   },
  post_published: { icon: '📣', label: 'Post Published', color: 'text-orange-500'  },
}

function fmtDate(ts) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ActivityLog({ deal }) {
  const [entries, setEntries] = useState([])
  const [note, setNote]       = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => { loadEntries() }, [deal.id])

  async function loadEntries() {
    const { data } = await supabase
      .from('activity_log')
      .select('*')
      .eq('deal_id', deal.id)
      .order('created_at', { ascending: false })
    if (data) setEntries(data)
  }

  async function addNote() {
    const body = note.trim()
    if (!body) return
    setPosting(true)

    const payload = {
      type:       'note',
      body,
      deal_id:    deal.id,
      partner_id: deal.partner_id ?? null,
    }
    const { data } = await supabase
      .from('activity_log')
      .insert(payload)
      .select()
      .single()

    setEntries(prev => [
      data ?? { id: crypto.randomUUID(), ...payload, created_at: new Date().toISOString() },
      ...prev,
    ])
    setNote('')
    setPosting(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addNote()
  }

  return (
    <div className="bg-white rounded-[14px] border border-gray-100 p-4 flex flex-col h-full">
      <h3
        className="text-sm font-semibold text-[#111827] mb-3"
        style={{ fontFamily: "'Manrope', sans-serif" }}
      >
        Activity Log
      </h3>

      {/* Note entry */}
      <div className="flex gap-2 mb-4">
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a note… (Ctrl+↵ to save)"
          rows={2}
          className="flex-1 text-sm border border-gray-200 rounded px-3 py-2 resize-none focus:outline-none focus:border-[#1D4ED8] text-[#111827]"
          style={{ fontFamily: 'Manrope, sans-serif' }}
        />
        <button
          onClick={addNote}
          disabled={posting || !note.trim()}
          className="bg-[#1D4ED8] hover:bg-[#1D4ED8]/90 disabled:opacity-40 text-white text-xs font-medium px-3 py-2 rounded transition-colors self-start"
          style={{ fontFamily: 'Manrope, sans-serif' }}
        >
          Log
        </button>
      </div>

      {/* Timeline */}
      <div className="space-y-3 overflow-y-auto flex-1 max-h-80 pr-1">
        {entries.length === 0 ? (
          <p
            className="text-xs text-gray-400 text-center py-6"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            No activity yet — add a note above
          </p>
        ) : entries.map(entry => {
          const cfg = TYPE_CONFIG[entry.type] ?? TYPE_CONFIG.note
          return (
            <div key={entry.id} className="flex gap-3 pb-3 border-b border-gray-50 last:border-0">
              <span className="text-base mt-0.5 shrink-0 leading-none">{cfg.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wide ${cfg.color}`}
                    style={{ fontFamily: 'Manrope, sans-serif' }}
                  >
                    {cfg.label}
                  </span>
                  <span
                    className="text-[10px] text-gray-400"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    {fmtDate(entry.created_at)}
                  </span>
                </div>
                <p
                  className="text-sm text-[#111827] leading-snug"
                  style={{ fontFamily: 'Manrope, sans-serif' }}
                >
                  {entry.body}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
