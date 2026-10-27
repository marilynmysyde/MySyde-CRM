import { useState } from 'react'
import { supabase } from '../../lib/supabase'

// Lets a signed-in user (e.g. someone who has only ever used the magic link)
// set or change a password, so they can use the email + password login.
export default function SetPasswordModal({ onClose }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [done, setDone]         = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (password.length < 8) return setError('Use at least 8 characters.')
    if (password !== confirm) return setError("Passwords don't match.")
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password, data: { has_password: true } })
    setLoading(false)
    if (error) setError(error.message)
    else setDone(true)
  }

  const inputClass = 'w-full text-sm border border-[#E5E7EB] rounded px-3 py-2 focus:outline-none focus:border-[#1D4ED8] text-[#111827]'
  const labelClass = 'text-[10px] uppercase tracking-wide text-[#6B7280] font-semibold block mb-1'

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[14px] shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        {done ? (
          <div className="text-center">
            <div className="text-3xl mb-3">🔐</div>
            <h2 className="text-base font-bold text-[#111827] mb-1">Password saved</h2>
            <p className="text-sm text-[#6B7280]">You can now sign in with your email and this password.</p>
            <button
              onClick={onClose}
              className="mt-5 w-full bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-semibold py-2.5 rounded-[8px]"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <h2 className="text-base font-bold text-[#111827]">Set your password</h2>
            <div>
              <label className={labelClass}>New password</label>
              <input type="password" autoFocus autoComplete="new-password" value={password}
                onChange={e => setPassword(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Confirm password</label>
              <input type="password" autoComplete="new-password" value={confirm}
                onChange={e => setConfirm(e.target.value)} className={inputClass} />
            </div>
            {error && (
              <p className="text-xs text-[#E11D48] bg-[#E11D48]/5 border border-[#E11D48]/20 rounded px-3 py-2">{error}</p>
            )}
            <div className="flex gap-2">
              <button type="button" onClick={onClose}
                className="flex-1 border border-[#E5E7EB] text-[#111827] text-sm font-semibold py-2.5 rounded-[8px] hover:bg-[#F9FAFB]">
                Cancel
              </button>
              <button type="submit" disabled={loading || !password || !confirm}
                className="flex-1 bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-[8px]">
                {loading ? 'Saving…' : 'Save password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
