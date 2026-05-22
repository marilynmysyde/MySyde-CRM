import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

// ─── Sample data fallback ─────────────────────────────────────────────────────

const SAMPLE_RESULTS = [
  { type: 'deal',    id: 'sample-1', label: 'Top Banner — Screen 1',              sub: 'Prospect · MH Chamber',         to: '/deal/sample-1'          },
  { type: 'deal',    id: 'sample-2', label: 'Start Screen Sponsor — Both Screens', sub: 'Proposal · Downtown MH',        to: '/deal/sample-2'          },
  { type: 'partner', id: 'p1',       label: 'Morgan Hill Chamber of Commerce',     sub: 'Chamber',                       to: '/partner/p1'             },
  { type: 'partner', id: 'p2',       label: 'City of Morgan Hill',                 sub: 'City / Gov',                    to: '/partner/p2'             },
  { type: 'contact', id: 'c1',       label: 'Sandra Lee',                          sub: 'Executive Director · MH Chamber',to: '/contacts/c1'           },
  { type: 'contact', id: 'c2',       label: 'James Ortega',                        sub: 'City Manager · City of MH',     to: '/contacts/c2'            },
  { type: 'kiosk',   id: 'kiosk-1',  label: 'Kiosk 01 — Town Clock Plaza',         sub: 'Active',                        to: '/kiosks/kiosk-1'         },
  { type: 'post',    id: 'sp-1',     label: 'Chamber Expo Highlight',              sub: 'Idea · Instagram, Facebook',    to: '/social'                 },
  { type: 'post',    id: 'sp-2',     label: 'Kiosk Launch Announcement',           sub: 'Draft · Instagram, Facebook, LinkedIn', to: '/social'         },
]

const TYPE_CONFIG = {
  deal:    { label: 'Deal',    icon: '📋', color: 'text-purple-600' },
  partner: { label: 'Partner', icon: '🤝', color: 'text-[#02348E]' },
  contact: { label: 'Contact', icon: '👤', color: 'text-green-600'  },
  kiosk:   { label: 'Kiosk',   icon: '📺', color: 'text-orange-500' },
  post:    { label: 'Post',    icon: '📱', color: 'text-pink-600'   },
}

// ─── Search logic ─────────────────────────────────────────────────────────────

async function searchAll(q) {
  if (!q || q.length < 2) return []

  try {
    const [deals, partners, contacts, kiosks, posts] = await Promise.all([
      supabase.from('deals').select('id, title, stage, partners(name)').ilike('title', `%${q}%`).limit(5),
      supabase.from('partners').select('id, name, type').ilike('name', `%${q}%`).limit(5),
      supabase.from('contacts').select('id, name, role, partners(name)').ilike('name', `%${q}%`).limit(5),
      supabase.from('kiosks').select('id, name, status').ilike('name', `%${q}%`).limit(5),
      supabase.from('posts').select('id, title, status, platforms').ilike('title', `%${q}%`).limit(5),
    ])

    const results = []

    for (const d of deals.data ?? []) {
      results.push({ type: 'deal', id: d.id, label: d.title, sub: `${d.stage} · ${d.partners?.name ?? '—'}`, to: `/deal/${d.id}` })
    }
    for (const p of partners.data ?? []) {
      results.push({ type: 'partner', id: p.id, label: p.name, sub: p.type, to: `/partner/${p.id}` })
    }
    for (const c of contacts.data ?? []) {
      results.push({ type: 'contact', id: c.id, label: c.name, sub: `${c.role ?? ''} · ${c.partners?.name ?? ''}`.trim().replace(/^·\s*/, ''), to: `/contacts/${c.id}` })
    }
    for (const k of kiosks.data ?? []) {
      results.push({ type: 'kiosk', id: k.id, label: k.name, sub: k.status, to: `/kiosks/${k.id}` })
    }
    for (const p of posts.data ?? []) {
      results.push({ type: 'post', id: p.id, label: p.title, sub: `${p.status} · ${(p.platforms ?? []).join(', ')}`, to: '/social' })
    }

    return results
  } catch {
    // Fall back to filtering sample data
    const lq = q.toLowerCase()
    return SAMPLE_RESULTS.filter(r =>
      r.label.toLowerCase().includes(lq) || r.sub.toLowerCase().includes(lq)
    )
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GlobalSearch() {
  const navigate          = useNavigate()
  const [open,    setOpen]    = useState(false)
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState([])
  const [active,  setActive]  = useState(0)
  const [loading, setLoading] = useState(false)
  const inputRef  = useRef(null)
  const debounce  = useRef(null)

  // Open on Cmd+K or /
  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 50) }
    else       { setQuery(''); setResults([]); setActive(0) }
  }, [open])

  const runSearch = useCallback((q) => {
    clearTimeout(debounce.current)
    if (!q || q.length < 2) { setResults([]); setLoading(false); return }
    setLoading(true)
    debounce.current = setTimeout(async () => {
      const r = await searchAll(q)
      setResults(r)
      setActive(0)
      setLoading(false)
    }, 250)
  }, [])

  function handleChange(e) {
    setQuery(e.target.value)
    runSearch(e.target.value)
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') { setOpen(false); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(a => Math.max(a - 1, 0)) }
    if (e.key === 'Enter' && results[active]) { go(results[active]) }
  }

  function go(result) {
    navigate(result.to)
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white rounded px-3 py-1.5 text-sm transition-colors"
        style={{ fontFamily: 'Roboto, sans-serif' }}
        title="Search (Ctrl+K)"
      >
        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <span>Search</span>
        <kbd className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded font-mono ml-1">Ctrl+K</kbd>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setOpen(false)} />

      {/* Panel */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">

        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <svg width="15" height="15" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24" className="shrink-0">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Search deals, partners, contacts, kiosks, posts…"
            className="flex-1 text-sm text-[#010100] placeholder-gray-400 focus:outline-none"
            style={{ fontFamily: 'Roboto, sans-serif' }}
          />
          {loading && (
            <span className="text-xs text-gray-400 shrink-0" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
              Searching…
            </span>
          )}
          <kbd
            className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono shrink-0"
            onClick={() => setOpen(false)}
          >
            Esc
          </kbd>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="max-h-80 overflow-y-auto py-1">
            {results.map((r, i) => {
              const cfg = TYPE_CONFIG[r.type] ?? TYPE_CONFIG.deal
              return (
                <button
                  key={r.id}
                  onClick={() => go(r)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    i === active ? 'bg-[#02348E]/8' : 'hover:bg-gray-50'
                  }`}
                >
                  <span className="text-base shrink-0">{cfg.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm text-[#010100] truncate font-medium"
                      style={{ fontFamily: 'Roboto, sans-serif' }}
                    >
                      {r.label}
                    </p>
                    <p
                      className="text-[10px] text-gray-400 truncate"
                      style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
                    >
                      {r.sub}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wide shrink-0 ${cfg.color}`}
                    style={{ fontFamily: 'Roboto, sans-serif' }}
                  >
                    {cfg.label}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {query.length >= 2 && results.length === 0 && !loading && (
          <div className="px-4 py-6 text-center text-sm text-gray-400" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
            No results for "{query}"
          </div>
        )}

        {query.length < 2 && (
          <div className="px-4 py-4">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2" style={{ fontFamily: 'Roboto, sans-serif' }}>
              Jump to
            </p>
            <div className="flex gap-2 flex-wrap">
              {[
                { label: 'Board',     to: '/board'     },
                { label: 'Partners',  to: '/partners'  },
                { label: 'Tasks',     to: '/tasks'     },
                { label: 'Social',    to: '/social'    },
                { label: 'Kiosks',    to: '/kiosks'    },
                { label: 'Dashboard', to: '/dashboard' },
              ].map(l => (
                <button
                  key={l.to}
                  onClick={() => { navigate(l.to); setOpen(false) }}
                  className="text-xs bg-gray-100 hover:bg-[#02348E]/10 text-gray-600 hover:text-[#02348E] px-2.5 py-1 rounded-full transition-colors"
                  style={{ fontFamily: 'Roboto, sans-serif' }}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
