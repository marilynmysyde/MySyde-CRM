import { useState } from 'react'
import { supabase } from '../../lib/supabase'

const STEPS = [
  { key: 'briefed',     label: 'Brief',    icon: '📋' },
  { key: 'in_progress', label: 'Draft',    icon: '✏️' },
  { key: 'revised',     label: 'Revise',   icon: '🔄' },
  { key: 'approved',    label: 'Approved', icon: '✅' },
  { key: 'uploaded',    label: 'Uploaded', icon: '📤' },
]

// Ordered list including 'none' as index 0
const ORDER = ['none', 'briefed', 'in_progress', 'revised', 'approved', 'uploaded']

export default function CreativeTracker({ deal, onUpdate }) {
  const [status, setStatus] = useState(deal.design_status ?? 'none')
  const [saving, setSaving] = useState(false)

  const currentIdx = ORDER.indexOf(status)

  async function setStep(stepKey) {
    setSaving(true)
    await supabase.from('deals')
      .update({ design_status: stepKey })
      .eq('id', deal.id)
    setStatus(stepKey)
    setSaving(false)
    onUpdate?.({ design_status: stepKey })
  }

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3
          className="text-sm font-semibold text-[#010100]"
          style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
        >
          Creative Status
        </h3>
        {saving && (
          <span className="text-xs text-gray-400" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
            Saving…
          </span>
        )}
      </div>

      <div className="flex items-stretch gap-1">
        {STEPS.map((step, idx) => {
          const stepOrderIdx = idx + 1
          const isActive     = ORDER[stepOrderIdx] === status
          const isDone       = stepOrderIdx < currentIdx
          const isNext       = stepOrderIdx === currentIdx + 1

          return (
            <div key={step.key} className="flex items-center flex-1 gap-1">
              <button
                onClick={() => setStep(isActive ? 'none' : step.key)}
                title={
                  isActive ? 'Click to reset'
                  : isDone  ? 'Click to revert to this step'
                  : isNext  ? 'Click to advance'
                  : 'Click to jump to this step'
                }
                className={`flex flex-col items-center gap-1 flex-1 py-2.5 px-1 rounded-lg transition-all ${
                  isActive
                    ? 'bg-[#02348E] text-white shadow-sm'
                    : isDone
                    ? 'bg-[#02348E]/10 text-[#02348E] hover:bg-[#02348E]/20'
                    : isNext
                    ? 'bg-gray-50 text-gray-400 hover:bg-[#FFEC00]/30 hover:text-[#010100] border border-dashed border-gray-200'
                    : 'bg-gray-50 text-gray-300 hover:bg-gray-100'
                }`}
              >
                <span className="text-sm leading-none">{step.icon}</span>
                <span
                  className="text-[9px] font-semibold uppercase tracking-wide leading-none"
                  style={{ fontFamily: 'Roboto, sans-serif' }}
                >
                  {step.label}
                </span>
              </button>
              {idx < STEPS.length - 1 && (
                <div
                  className={`h-0.5 w-1.5 shrink-0 rounded-full ${
                    stepOrderIdx < currentIdx ? 'bg-[#02348E]/40' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>

      {status === 'none' && (
        <p
          className="text-xs text-gray-400 mt-3 text-center"
          style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
        >
          Click <strong>Brief</strong> to kick off the creative process
        </p>
      )}
    </div>
  )
}
