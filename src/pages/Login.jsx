import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode]         = useState('password') // 'password' | 'magic'
  const [sent, setSent]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function submitPassword(e) {
    e.preventDefault()
    if (!email.trim() || !password) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      window.location.href = '/'
    }
  }

  async function submitMagic(e) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">

        {/* Logo */}
        <div className="mb-8 text-center">
          <div
            className="text-2xl font-bold text-[#1D4ED8] tracking-tight"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            MySyde Connect
          </div>
          <p className="text-sm text-gray-400 mt-1" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Internal CRM
          </p>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="text-4xl mb-4">📬</div>
            <h2 className="text-base font-semibold text-[#111827] mb-2" style={{ fontFamily: "'Manrope', sans-serif" }}>
              Check your email
            </h2>
            <p className="text-sm text-gray-500" style={{ fontFamily: 'Manrope, sans-serif' }}>
              We sent a sign-in link to <strong>{email}</strong>. Click it to access the CRM.
            </p>
            <button
              onClick={() => { setSent(false); setEmail('') }}
              className="mt-6 text-xs text-[#1D4ED8] hover:underline"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              Use a different email
            </button>
          </div>
        ) : mode === 'password' ? (
          <form onSubmit={submitPassword} className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Email
              </label>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@mysyde.com"
                className="w-full text-sm border border-gray-200 rounded px-3 py-2 focus:outline-none focus:border-[#1D4ED8] text-[#111827]"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-sm border border-gray-200 rounded px-3 py-2 focus:outline-none focus:border-[#1D4ED8] text-[#111827]"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              />
            </div>

            {error && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded px-3 py-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim() || !password}
              className="w-full bg-[#1D4ED8] hover:bg-[#1D4ED8]/90 disabled:opacity-40 text-white text-sm font-medium py-2.5 rounded transition-colors"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

            <button
              type="button"
              onClick={() => { setMode('magic'); setError('') }}
              className="w-full text-xs text-gray-400 hover:text-[#1D4ED8] text-center mt-1"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              Use email link instead
            </button>
          </form>
        ) : (
          <form onSubmit={submitMagic} className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Work Email
              </label>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@mysyde.com"
                className="w-full text-sm border border-gray-200 rounded px-3 py-2 focus:outline-none focus:border-[#1D4ED8] text-[#111827]"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              />
            </div>

            {error && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded px-3 py-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full bg-[#1D4ED8] hover:bg-[#1D4ED8]/90 disabled:opacity-40 text-white text-sm font-medium py-2.5 rounded transition-colors"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              {loading ? 'Sending…' : 'Send sign-in link'}
            </button>

            <button
              type="button"
              onClick={() => { setMode('password'); setError('') }}
              className="w-full text-xs text-gray-400 hover:text-[#1D4ED8] text-center mt-1"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              Use password instead
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
