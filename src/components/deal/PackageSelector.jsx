import { useState } from 'react'
import { supabase } from '../../lib/supabase'

const PACKAGES = [
  { key: 'starter',  label: 'Starter',  rate: 299, slot: 'Banner',      loops: '4×/hr',  design: false },
  { key: 'standard', label: 'Standard', rate: 499, slot: 'Full Panel',  loops: '8×/hr',  design: true  },
  { key: 'premium',  label: 'Premium',  rate: 799, slot: 'Full Screen', loops: '12×/hr', design: true  },
]

const MONTH_OPTIONS = [1, 2, 3, 4, 5, 6, 9, 12]

function fmt(v) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)
}

export default function PackageSelector({ deal, onUpdate }) {
  const [pkg, setPkg]       = useState(deal.package ?? 'starter')
  const [months, setMonths] = useState(deal.months ?? 3)
  const [saving, setSaving] = useState(false)

  const selected = PACKAGES.find(p => p.key === pkg) ?? PACKAGES[0]
  const total    = selected.rate * months

  async function persist(newPkg, newMonths) {
    setSaving(true)
    const rate = PACKAGES.find(p => p.key === newPkg)?.rate ?? 299
    await supabase.from('deals')
      .update({ package: newPkg, monthly_rate: rate, months: newMonths })
      .eq('id', deal.id)
    setSaving(false)
    onUpdate?.({ package: newPkg, monthly_rate: rate, months: newMonths })
  }

  function selectPkg(key) { setPkg(key); persist(key, months) }
  function changeMonths(m) { setMonths(m); persist(pkg, m) }

  return (
    <div className="bg-white rounded-[14px] border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3
          className="text-sm font-semibold text-[#111827]"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          Package
        </h3>
        {saving && (
          <span className="text-xs text-gray-400" style={{ fontFamily: "'Manrope', sans-serif" }}>
            Saving…
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {PACKAGES.map(p => (
          <button
            key={p.key}
            onClick={() => selectPkg(p.key)}
            className={`rounded-lg border-2 p-3 text-left transition-all ${
              pkg === p.key
                ? 'border-[#1D4ED8] bg-[#1D4ED8]/5'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div
              className="text-[10px] font-semibold uppercase tracking-wide mb-1"
              style={{ fontFamily: 'Manrope, sans-serif', color: pkg === p.key ? '#1D4ED8' : '#9ca3af' }}
            >
              {p.label}
            </div>
            <div
              className="text-xl font-bold text-[#111827] leading-none mb-1"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              {fmt(p.rate)}
              <span className="text-xs font-normal text-gray-400">/mo</span>
            </div>
            <div
              className="text-[10px] text-gray-400 leading-tight"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              {p.slot} · {p.loops}
              {p.design && (
                <span className="ml-1 text-[#1D4ED8] font-medium">Design ✓</span>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4 pt-2 border-t border-gray-50">
        <div className="flex items-center gap-2">
          <label
            className="text-xs text-gray-500"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            Months
          </label>
          <select
            value={months}
            onChange={e => changeMonths(Number(e.target.value))}
            className="text-sm border border-gray-200 rounded px-2 py-1 text-[#111827] focus:outline-none focus:border-[#1D4ED8]"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            {MONTH_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500" style={{ fontFamily: 'Manrope, sans-serif' }}>
            3-month total
          </span>
          <span
            className="text-base font-bold text-[#1D4ED8]"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            {fmt(total)}
          </span>
        </div>
      </div>
    </div>
  )
}
